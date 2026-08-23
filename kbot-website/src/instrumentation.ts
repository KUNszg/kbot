export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  process.on('uncaughtException', error => {
    console.error('[Process] Uncaught exception (server kept alive):', error);
  });

  process.on('unhandledRejection', reason => {
    console.error('[Process] Unhandled rejection (server kept alive):', reason);
  });
}
