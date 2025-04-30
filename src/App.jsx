import React, { useState } from 'react';
import ChangeIPModal from './ChangeIPModal';

const menuItems = [
  { key: 'basic', label: 'Osnovne informacije' },
  { key: 'network', label: 'Omrežne informacije' },
  { key: 'wireless', label: 'Brezžične informacije' },
  { key: 'log', label: 'Dnevnik' },
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
    setStatus('povezovanje...');
    const res = await window.electronAPI.sendSSHCommand('connect', {
      host: ip,
      port,
      username,
      password,
    });
    setStatus(res.status === 'connected' ? 'povezano' : 'napaka');
  };

  const handleMenuClick = async (key) => {
    setSelected(key);
    if (key === 'changeip') {
      setShowChangeIP(true);
      return;
    }
    let cmd = '';
    setContent('Nalagam...');
    if (key === 'basic') {
      const up = await window.electronAPI.sendSSHCommand('run', { command: 'uptime' });
      const df = await window.electronAPI.sendSSHCommand('run', { command: 'df -h' });
      setContent(`--- Osnovne informacije ---\nČas delovanja: ${up.stdout}\n\nDiskovni prostor:\n${df.stdout}\n---------------------------`);
    } else if (key === 'network') {
      const res = await window.electronAPI.sendSSHCommand('run', { command: 'ifconfig' });
      setContent(`--- Omrežni vmesniki ---\n${res.stdout}\n----------------------------`);
    } else if (key === 'wireless') {
      const res = await window.electronAPI.sendSSHCommand('run', { command: 'iwinfo' });
      setContent(`--- Brezžične informacije ---\n${res.stdout}\n----------------------------`);
    } else if (key === 'log') {
      const res = await window.electronAPI.sendSSHCommand('run', { command: 'logread' });
      setContent(`--- Sistemsi dnevnik ---\n${res.stdout}\n------------------`);
    } else if (key === 'devices') {
      const res = await window.electronAPI.sendSSHCommand('get_dhcp_leases');
      if (res.leases && res.leases.length) {
        setContent(
          `--- Povezane naprave ---\nIP naslov      MAC naslov        Ime naprave\n` +
          res.leases.map(l => `${l.ip.padEnd(15)} ${l.mac.padEnd(18)} ${l.hostname}`).join('\n') +
          `\n---------------------------`
        );
      } else {
        setContent('Ni najdenih povezanih naprav.');
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
            <label>Vrata
              <input value={port} onChange={e => setPort(Number(e.target.value))} />
            </label>
            <label>Uporabniško ime
              <input value={username} onChange={e => setUsername(e.target.value)} />
            </label>
            <label>Geslo
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
            </label>
            <button className="connect-btn" onClick={connect}>Poveži</button>
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
