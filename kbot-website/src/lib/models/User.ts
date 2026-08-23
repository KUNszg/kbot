import getServiceConnector from '../serviceConnectorBridge';

export interface User {
  id: string;
  username: string;
  email?: string;
  image?: string;
  twitch_id?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserSetting {
  id: number;
  user_id: string;
  setting_key: string;
  setting_value: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface ConnectedApp {
  id: number;
  user_id: string;
  app_name: string;
  app_type: 'spotify' | 'discord';
  access_token?: string;
  refresh_token?: string;
  expires_at?: Date;
  permissions?: string[];
  connected_at?: Date;
  updated_at?: Date;
}

interface ConnectedAppRow extends Omit<ConnectedApp, 'permissions'> {
  permissions?: string | string[];
}

export class UserModel {
  static async findById(id: string): Promise<User | null> {
    try {
      const { sqlClient } = await getServiceConnector();
      const result = await sqlClient.query<User[]>('SELECT * FROM kbot_website.users WHERE id = ?', [id]);
      const rows = Array.isArray(result) ? result : [];
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  static async findByTwitchId(twitchId: string): Promise<User | null> {
    try {
      const { sqlClient } = await getServiceConnector();
      const result = await sqlClient.query<User[]>('SELECT * FROM kbot_website.users WHERE twitch_id = ?', [
        twitchId
      ]);
      const rows = Array.isArray(result) ? result : [];
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding user by Twitch ID:', error);
      return null;
    }
  }

  static async create(
    userData: Omit<User, 'created_at' | 'updated_at'>
  ): Promise<User | null> {
    try {
      const { sqlClient } = await getServiceConnector();
      await sqlClient.query(
        'INSERT INTO kbot_website.users (id, username, email, image, twitch_id) VALUES (?, ?, ?, ?, ?)',
        [userData.id, userData.username, userData.email, userData.image, userData.twitch_id]
      );
      return await this.findById(userData.id);
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  static async update(id: string, userData: Partial<User>): Promise<User | null> {
    try {
      const { sqlClient } = await getServiceConnector();
      const fields = Object.keys(userData).filter(key => key !== 'id');
      const values = fields.map(key => userData[key as keyof User]);
      const setClause = fields.map(field => `${field} = ?`).join(', ');

      await sqlClient.query(`UPDATE kbot_website.users SET ${setClause} WHERE id = ?`, [
        ...values,
        id
      ]);
      return await this.findById(id);
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  static async getUserSettings(userId: string): Promise<UserSetting[]> {
    try {
      const { sqlClient } = await getServiceConnector();
      const result = await sqlClient.query<UserSetting[]>(
        'SELECT * FROM kbot_website.user_settings WHERE user_id = ?',
        [userId]
      );
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error getting user settings:', error);
      return [];
    }
  }

  static async setSetting(userId: string, key: string, value: string): Promise<boolean> {
    try {
      const { sqlClient } = await getServiceConnector();
      await sqlClient.query(
        'INSERT INTO kbot_website.user_settings (user_id, setting_key, setting_value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
        [userId, key, value]
      );
      return true;
    } catch (error) {
      console.error('Error setting user setting:', error);
      return false;
    }
  }

  static async getConnectedApps(userId: string): Promise<ConnectedApp[]> {
    try {
      const { sqlClient } = await getServiceConnector();
      const result = await sqlClient.query<ConnectedAppRow[]>(
        'SELECT * FROM kbot_website.connected_apps WHERE user_id = ?',
        [userId]
      );
      const rows = Array.isArray(result) ? result : [];

      return rows.map((row: ConnectedAppRow) => ({
        ...row,
        permissions:
          typeof row.permissions === 'string'
            ? JSON.parse(row.permissions)
            : row.permissions || []
      }));
    } catch (error) {
      console.error('Error getting connected apps:', error);
      return [];
    }
  }

  static async addConnectedApp(
    appData: Omit<ConnectedApp, 'id' | 'connected_at' | 'updated_at'>
  ): Promise<boolean> {
    try {
      const { sqlClient } = await getServiceConnector();
      await sqlClient.query(
        'INSERT INTO kbot_website.connected_apps (user_id, app_name, app_type, access_token, refresh_token, expires_at, permissions) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE access_token = VALUES(access_token), refresh_token = VALUES(refresh_token), expires_at = VALUES(expires_at), permissions = VALUES(permissions)',
        [
          appData.user_id,
          appData.app_name,
          appData.app_type,
          appData.access_token,
          appData.refresh_token,
          appData.expires_at,
          JSON.stringify(appData.permissions || [])
        ]
      );
      return true;
    } catch (error) {
      console.error('Error adding connected app:', error);
      return false;
    }
  }

  static async removeConnectedApp(userId: string, appType: string): Promise<boolean> {
    try {
      const { sqlClient } = await getServiceConnector();
      await sqlClient.query(
        'DELETE FROM kbot_website.connected_apps WHERE user_id = ? AND app_type = ?',
        [userId, appType]
      );
      return true;
    } catch (error) {
      console.error('Error removing connected app:', error);
      return false;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const { sqlClient } = await getServiceConnector();
      await sqlClient.query('DELETE FROM kbot_website.connected_apps WHERE user_id = ?', [id]);
      await sqlClient.query('DELETE FROM kbot_website.user_settings WHERE user_id = ?', [id]);
      await sqlClient.query('DELETE FROM kbot_website.users WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }
}
