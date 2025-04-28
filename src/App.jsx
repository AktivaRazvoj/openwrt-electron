import React, { useState } from 'react';
import ChangeIPModal from './ChangeIPModal';

const menuItems = [
  { key: 'basic', label: 'Osnove informacije' },
  { key: 'network', label: 'Network info' },
  { key: 'wireless', label: 'Wireless info' },
  { key: 'log', label: 'Log' },
  { key: 'devices', label: 'Povezane naprave' },
  { key: 'changeip', label: 'Spremeni IP', danger: true },
];

const defaultPort = 22;

export default function App() {
  const [ip, setIp] = useState('');
  const [port, setPort] = useState(defaultPort);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('disconnected');
  const [selected, setSelected] = useState('basic');
  const [content, setContent] = useState('content');
  const [showChangeIP, setShowChangeIP] = useState(false);

  const connect = async () => {
    setStatus('connecting...');
    const res = await window.electronAPI.sendSSHCommand('connect', {
      host: ip,
      port,
      username,
      password,
    });
    setStatus(res.status === 'connected' ? 'connected' : 'error');
  };

  const handleMenuClick = async (key) => {
    setSelected(key);
    if (key === 'changeip') {
      setShowChangeIP(true);
      return;
    }
    let cmd = '';
    setContent('Loading...');
    if (key === 'basic') {
      const up = await window.electronAPI.sendSSHCommand('run', { command: 'uptime' });
      const df = await window.electronAPI.sendSSHCommand('run', { command: 'df -h' });
      setContent(`--- Basic Information ---\nUptime: ${up.stdout}\n\nDisk Space:\n${df.stdout}\n---------------------------`);
    } else if (key === 'network') {
      const res = await window.electronAPI.sendSSHCommand('run', { command: 'ifconfig' });
      setContent(`--- Network Interfaces ---\n${res.stdout}\n----------------------------`);
    } else if (key === 'wireless') {
      const res = await window.electronAPI.sendSSHCommand('run', { command: 'iwinfo' });
      setContent(`--- Wireless Information ---\n${res.stdout}\n----------------------------`);
    } else if (key === 'log') {
      const res = await window.electronAPI.sendSSHCommand('run', { command: 'logread' });
      setContent(`--- System Log ---\n${res.stdout}\n------------------`);
    } else if (key === 'devices') {
      const res = await window.electronAPI.sendSSHCommand('get_dhcp_leases');
      if (res.leases && res.leases.length) {
        setContent(
          `--- Connected Devices ---\nIP Address      MAC Address       Hostname\n` +
          res.leases.map(l => `${l.ip.padEnd(15)} ${l.mac.padEnd(18)} ${l.hostname}`).join('\n') +
          `\n---------------------------`
        );
      } else {
        setContent('No connected devices found.');
      }
    }
  };

  return (
    <div className="container">
      <aside className="sidebar">
        <div className="logo">
          <img src="https://aktiva-varovanje.si/wp-content/uploads/sites/8/2024/02/Aktiva_Varovanje.png" alt="AKTIVA" />
         
        </div>
        {menuItems.map((item) => (
          <button
            key={item.key}
            className={`menu-btn${selected === item.key ? ' active' : ''}${item.danger ? ' danger' : ''}`}
            onClick={() => handleMenuClick(item.key)}
          >
            {item.label}
          </button>
        ))}
        <div className="footer">April 2025 v1.0.0</div>
      </aside>
      <main className="main">
        <section className="connection">
          <div className="conn-title">Podatki za povezavo</div>
          <div className="conn-fields">
            <label>IP naslov
              <input value={ip} onChange={e => setIp(e.target.value)} />
            </label>
            <label>Port
              <input value={port} onChange={e => setPort(Number(e.target.value))} />
            </label>
            <label>Username
              <input value={username} onChange={e => setUsername(e.target.value)} />
            </label>
            <label>Password
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
            </label>
            <button className="connect-btn" onClick={connect}>Connect</button>
            <span className={`status ${status}`}>Status: {status}</span>
          </div>
        </section>
        <section className="content-area">
          <pre>{content}</pre>
        </section>
        <ChangeIPModal open={showChangeIP} onClose={() => setShowChangeIP(false)} onChanged={() => setShowChangeIP(false)} />
      </main>
    </div>
  );
}
