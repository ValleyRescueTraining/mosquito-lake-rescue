import { useState } from 'react';
import { saveMapPoint } from '../services/mapPoints';
import type { MapPoint, MapPointCategory } from '../types';

const categories: MapPointCategory[] = [
  'hazard',
  'launch',
  'island',
  'landmark',
  'dock',
  'responder_asset',
  'access',
  'zone',
  'other',
];

const emptyPoint = {
  name: '',
  category: 'landmark' as MapPointCategory,
  zone: '',
  description: '',
  latitude: '',
  longitude: '',
  public_visible: true,
  visible_from_water: true,
};

export function AdminInterface({
  mapPoints,
  onMapPointsChange,
}: {
  mapPoints: MapPoint[];
  onMapPointsChange: (points: MapPoint[]) => void;
}) {
  const [form, setForm] = useState(emptyPoint);
  const [status, setStatus] = useState<string | null>(null);

  const handleSave = async () => {
    if (!form.name || !form.latitude || !form.longitude) {
      setStatus('Name, latitude, and longitude are required.');
      return;
    }

    try {
      const saved = await saveMapPoint({
        name: form.name,
        category: form.category,
        zone: form.zone || null,
        description: form.description || null,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        public_visible: form.public_visible,
        visible_from_water: form.visible_from_water,
      });
      onMapPointsChange([saved, ...mapPoints.filter((point) => point.id !== saved.id)]);
      setForm(emptyPoint);
      setStatus('Map point saved.');
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  return (
    <div className="panel-stack">
      <section className="action-card">
        <h2>Manage Map Points</h2>
        <p className="muted">
          Add or edit landmarks, hazards, launches, docks, islands, access points, and
          responder assets. Category and zone management is ready to move into database
          tables when the taxonomy is finalized.
        </p>

        <label>
          Name
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Example: State Route 305 Launch"
          />
        </label>
        <label>
          Category
          <select
            value={form.category}
            onChange={(event) =>
              setForm({ ...form, category: event.target.value as MapPointCategory })
            }
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category.replace('_', ' ')}
              </option>
            ))}
          </select>
        </label>
        <div className="field-row">
          <label>
            Latitude
            <input
              value={form.latitude}
              onChange={(event) => setForm({ ...form, latitude: event.target.value })}
              inputMode="decimal"
            />
          </label>
          <label>
            Longitude
            <input
              value={form.longitude}
              onChange={(event) => setForm({ ...form, longitude: event.target.value })}
              inputMode="decimal"
            />
          </label>
        </div>
        <label>
          Zone
          <input
            value={form.zone}
            onChange={(event) => setForm({ ...form, zone: event.target.value })}
            placeholder="Example: North Basin"
          />
        </label>
        <label>
          Description
          <textarea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </label>
        <div className="toggle-row">
          <label>
            <input
              type="checkbox"
              checked={form.public_visible}
              onChange={(event) => setForm({ ...form, public_visible: event.target.checked })}
            />
            Public visible
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.visible_from_water}
              onChange={(event) =>
                setForm({ ...form, visible_from_water: event.target.checked })
              }
            />
            Visible from water
          </label>
        </div>
        <button className="primary-action" type="button" onClick={handleSave}>
          Save map point
        </button>
      </section>

      <section className="action-card">
        <h2>Current Points</h2>
        <div className="point-list">
          {mapPoints.map((point) => (
            <article key={point.id} className="point-row">
              <div>
                <strong>{point.name}</strong>
                <p>
                  {point.category.replace('_', ' ')}
                  {point.zone ? ` - ${point.zone}` : ''}
                </p>
              </div>
              <span>{point.public_visible ? 'Public' : 'Responder'}</span>
            </article>
          ))}
          {mapPoints.length === 0 && <p className="muted">No map points loaded yet.</p>}
        </div>
      </section>

      <section className="action-card">
        <h2>Future Admin Tables</h2>
        <div className="chip-grid">
          <span>Categories</span>
          <span>Zones</span>
          <span>Responder assets</span>
          <span>Water-visible points</span>
        </div>
      </section>

      {status && <p className="status-text">{status}</p>}
    </div>
  );
}
