const fs = require('fs');
const moment = require('moment');
const zlib = require('zlib');
const _ = require('lodash');
const got = require('got');

const { exec } = require('child_process');
const { createConnection } = require('mysql2');
const { promisify } = require('util');
const { pipeline } = require('stream');

const ONEDRIVE_REFRESH_TOKEN = process.env.ONEDRIVE_REFRESH_TOKEN;
const ONEDRIVE_CLIENT_ID = process.env.ONEDRIVE_CLIENT_ID;
const ONEDRIVE_CLIENT_SECRET = process.env.ONEDRIVE_CLIENT_SECRET;

const MYSQL_HOST = process.env.MYSQL_HOST;
const MYSQL_USER = process.env.MYSQL_USER;
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD;
const MYSQL_DATABASE = process.env.MYSQL_DATABASE;

const mysqlConfig = {
  host: MYSQL_HOST,
  user: MYSQL_USER,
  password: MYSQL_PASSWORD,
  database: MYSQL_DATABASE,
};

const batchSize = 250 * 1024 * 1024;

const connection = createConnection(mysqlConfig);

if (process.platform !== 'linux') {
  throw 'Incorrect OS. This solution works only on linux (host server).';
}

connection.connect(async err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }

  let body = `grant_type=refresh_token&refresh_token=${ONEDRIVE_REFRESH_TOKEN}&client_id=${ONEDRIVE_CLIENT_ID}&client_secret=${ONEDRIVE_CLIENT_SECRET}&scope=Files.ReadWrite.All&redirect_uri=http://localhost`;

  let config = {
    method: 'POST',
    url: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  };

  const { access_token: apiKey } = await got(config).json();

  const onedriveConfig = {
    apiKey,
    uploadRootUrl: 'https://graph.microsoft.com/v1.0/me/drive/root:/backup_kbot/',
  };

  try {
    const [tableRows] = await connection
      .promise()
      .query(
        'SELECT table_name as table_temp FROM information_schema.tables WHERE table_schema = ?',
        [mysqlConfig.database]
      );
    const tables = tableRows.map(row => row.table_temp);

    const currentDate = moment().format('YYYY-MM-DD_HH-mm-ss');
    const backupDirectory = `backups_${currentDate}`;
    fs.mkdirSync(backupDirectory);

    for (const table of tables) {
      const dumpFileName = `${backupDirectory}/${table}.sql`;

      const dumpCommand = `mysqldump -h ${mysqlConfig.host} -u ${mysqlConfig.user} -p${mysqlConfig.password} ${mysqlConfig.database} ${table} > ${dumpFileName}`;

      await promisify(exec)(dumpCommand);

      const compressedFilePath = `${dumpFileName}.gz`;

      const zip = zlib.createGzip();
      const readStream = fs.createReadStream(dumpFileName);
      const writeStream = fs.createWriteStream(compressedFilePath);

      const pipelineAsync = promisify(pipeline);
      await pipelineAsync(readStream, zip, writeStream);

      fs.unlinkSync(dumpFileName);

      const uploadSessionId = `${table}_${Date.now()}`;
      const uploadUrl = `${onedriveConfig.uploadRootUrl}${backupDirectory}/${uploadSessionId}.sql.gz:/createUploadSession`;

      const stats = fs.statSync(compressedFilePath);
      const fileSize = stats.size;

      const options = {
        headers: {
          Authorization: `Bearer ${onedriveConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: fs.readFileSync(compressedFilePath, 'base64') }),
      };

      try {
        const result = await got.post(uploadUrl, options);
        const session = JSON.parse(_.get(result, 'body'));

        const startByte = parseInt(_.get(session, 'nextExpectedRanges')[0].split('-')[0]);
        const endByte = Math.min(startByte + batchSize, fileSize - 1);
        const contentRange = `bytes ${startByte}-${endByte}/${fileSize}`;

        const optionsChunk = {
          headers: {
            'Content-Range': contentRange,
            Authorization: `Bearer ${onedriveConfig.apiKey}`,
            'Content-Type': 'application/octet-stream',
          },
          body: fs.createReadStream(compressedFilePath),
        };

        try {
          await got.put(_.get(session, 'uploadUrl'), optionsChunk);
        } catch (error) {
          console.error(`Error uploading chunk for ${compressedFilePath} to OneDrive:`, error);
        }

        console.log(`Backup for table ${table} uploaded to OneDrive successfully`);
      } catch (error) {
        console.error(
          `Error uploading file ${compressedFilePath} to OneDrive:`,
          error.response?.body
        );
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    connection.end();
  }
});
