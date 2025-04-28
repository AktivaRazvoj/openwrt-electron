const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

function parseDHCPLeases(output) {
  // Format: <expiry> <mac> <ip> <hostname> <clientid>
  return output.split('\n').filter(Boolean).map(line => {
    const [expiry, mac, ip, hostname] = line.split(/\s+/);
    return { ip, mac, hostname };
  });
}

function parseNetworkInterfaces(output) {
  // Parse UCI output for interfaces
  const lines = output.split('\n');
  const interfaces = {};
  lines.forEach(line => {
    let match = line.match(/network\.([\w]+)\.device='([\w-]+)'/);
    if (match) interfaces[match[2]] = match[1];
    else {
      match = line.match(/network\.([\w]+)\.ifname='([\w-]+)'/);
      if (match) interfaces[match[2]] = match[1];
    }
  });
  return interfaces;
}

function handleSSHCommands(ipcMain) {
  let connected = false;
  let lastConfig = {};

  ipcMain.handle('ssh-command', async (event, cmd, params) => {
    try {
      if (cmd === 'connect') {
        await ssh.connect({
          host: params.host,
          port: params.port,
          username: params.username,
          password: params.password,
        });
        connected = true;
        lastConfig = params;
        return { status: 'connected' };
      }
      if (cmd === 'disconnect') {
        ssh.dispose();
        connected = false;
        return { status: 'disconnected' };
      }
      if (!connected) {
        return { error: 'Not connected' };
      }
      if (cmd === 'run') {
        const result = await ssh.execCommand(params.command);
        return { stdout: result.stdout, stderr: result.stderr };
      }
      if (cmd === 'get_dhcp_leases') {
        const result = await ssh.execCommand('cat /tmp/dhcp.leases');
        return { leases: parseDHCPLeases(result.stdout) };
      }
      if (cmd === 'get_interfaces') {
        const result = await ssh.execCommand('uci show network');
        return { interfaces: parseNetworkInterfaces(result.stdout) };
      }
      if (cmd === 'get_interface_ip') {
        const { section } = params;
        const ip = (await ssh.execCommand(`uci get network.${section}.ipaddr`)).stdout.trim();
        const netmask = (await ssh.execCommand(`uci get network.${section}.netmask`)).stdout.trim();
        return { ip, netmask };
      }
      if (cmd === 'change_ip') {
        const { section, newIp, newNetmask } = params;
        await ssh.execCommand(`uci set network.${section}.ipaddr='${newIp}'`);
        await ssh.execCommand(`uci set network.${section}.netmask='${newNetmask}'`);
        await ssh.execCommand('uci commit network');
        const reload = await ssh.execCommand('/etc/init.d/network reload');
        return { result: reload.stdout || reload.stderr };
      }
    } catch (err) {
      return { error: err.message };
    }
  });
}

module.exports = { handleSSHCommands };
