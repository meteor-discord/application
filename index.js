const time = Date.now();

console.log(`[${process.env.HOSTNAME || 'meteor'}] launching bot`);

// Get the correct path for each environment type
let client = './charmer/client.js';
if (process.env.PATH_OVERRIDE) client = process.env.PATH_OVERRIDE;

// Import and run the client directly
require(client);

console.log(`[${process.env.HOSTNAME || 'meteor'}] bot ready (${Date.now() - time}ms)`);
