import React, { useEffect, useState } from 'react';

export default function ChangeIPModal({ open, onClose, onChanged }) {
  const [interfaces, setInterfaces] = useState({});
  const [selected, setSelected] = useState('');
  const [ip, setIp] = useState('');
  const [netmask, setNetmask] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (open) {
      window.electronAPI.sendSSHCommand('get_interfaces').then(res => {
        setInterfaces(res.interfaces || {});
        const first = Object.keys(res.interfaces || {})[0];
        setSelected(first);
      });
    }
  }, [open]);

  useEffect(() => {
    if (selected) {
      window.electronAPI.sendSSHCommand('get_interface_ip', { section: interfaces[selected] })
        .then(res => {
          setIp(res.ip || '');
          setNetmask(res.netmask || '');
        });
    }
  }, [selected, interfaces]);

  const handleChange = async () => {
    setLoading(true);
    setMsg('');
    const res = await window.electronAPI.sendSSHCommand('change_ip', {
      section: interfaces[selected],
      newIp: ip,
      newNetmask: netmask,
    });
    setLoading(false);
    if (res.error) setMsg(res.error);
    else setMsg('IP changed. You may lose connection.');
    if (onChanged) onChanged();
  };

  if (!open) return null;
  return (
    <div className="modal-bg">
      <div className="modal">
        <h2>Spremeni IP</h2>
        <label>
          Vmesnik:
          <select value={selected} onChange={e => setSelected(e.target.value)}>
            {Object.keys(interfaces).map(iface => (
              <option key={iface} value={iface}>{iface}</option>
            ))}
          </select>
        </label>
        <label>
          Nov IP:
          <input value={ip} onChange={e => setIp(e.target.value)} />
        </label>
        <label>
          Nova maska:
          <input value={netmask} onChange={e => setNetmask(e.target.value)} />
        </label>
        <div style={{ marginTop: 10 }}>
          <button onClick={handleChange} disabled={loading}>Potrdi</button>
          <button onClick={onClose} style={{ marginLeft: 8 }}>Prekliči</button>
        </div>
        {msg && <div style={{ marginTop: 10, color: '#a33' }}>{msg}</div>}
      </div>
    </div>
  );
}
