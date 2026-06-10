import { useEffect, useState } from 'react';
import { saveMapPoint } from '../services/mapPoints';
import { loadAgencies, loadResources, saveAgency, saveResource } from '../services/operations';
import type {
  Agency,
  MapPoint,
  MapPointCategory,
  RescueZone,
  Resource,
  ResourceStatus,
  ResourceType,
} from '../types';

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
  zone_id: '',
  zone: '',
  description: '',
  latitude: '',
  longitude: '',
  public_visible: true,
  visible_from_water: true,
};

const resourceTypes: ResourceType[] = ['Boat', 'Command', 'Diver', 'Sonar', 'EMS', 'Search'];
const resourceStatuses: ResourceStatus[] = [
  'Available',
  'Assigned',
  'En Route',
  'On Scene',
  'Searching',
  'Returning',
  'Out of Service',
];

const emptyResource = {
  id: '',
  name: '',
  agency: '',
  resource_type: 'Boat' as ResourceType,
  status: 'Available' as ResourceStatus,
  notes: '',
};

const emptyAgency = {
  id: '',
  name: '',
  agency_type: '',
  contact_notes: '',
};

export function AdminInterface({
  mapPoints,
  rescueZones,
  onMapPointsChange,
}: {
  mapPoints: MapPoint[];
  rescueZones: RescueZone[];
  onMapPointsChange: (points: MapPoint[]) => void;
}) {
  const [form, setForm] = useState(emptyPoint);
  const [resources, setResources] = useState<Resource[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [resourceForm, setResourceForm] = useState(emptyResource);
  const [agencyForm, setAgencyForm] = useState(emptyAgency);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([loadResources(), loadAgencies()])
      .then(([nextResources, nextAgencies]) => {
        setResources(nextResources);
        setAgencies(nextAgencies);
      })
      .catch((error: Error) => setStatus(error.message));
  }, []);

  const handleSave = async () => {
    if (!form.name || !form.latitude || !form.longitude) {
      setStatus('Name, latitude, and longitude are required.');
      return;
    }

    try {
      const saved = await saveMapPoint({
        name: form.name,
        category: form.category,
        zone_id: form.zone_id || null,
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

  const handleSaveResource = async () => {
    if (!resourceForm.id || !resourceForm.name || !resourceForm.agency) {
      setStatus('Resource id, name, and agency are required.');
      return;
    }

    try {
      const saved = await saveResource({
        id: resourceForm.id,
        name: resourceForm.name,
        agency: resourceForm.agency,
        resource_type: resourceForm.resource_type,
        status: resourceForm.status,
        notes: resourceForm.notes || null,
      });
      setResources([saved, ...resources.filter((resource) => resource.id !== saved.id)]);
      setResourceForm(emptyResource);
      setStatus('Resource saved.');
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  const handleSaveAgency = async () => {
    if (!agencyForm.id || !agencyForm.name) {
      setStatus('Agency id and name are required.');
      return;
    }

    try {
      const saved = await saveAgency({
        id: agencyForm.id,
        name: agencyForm.name,
        agency_type: agencyForm.agency_type || null,
        contact_notes: agencyForm.contact_notes || null,
        active: true,
      });
      setAgencies([saved, ...agencies.filter((agency) => agency.id !== saved.id)]);
      setAgencyForm(emptyAgency);
      setStatus('Agency saved.');
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
          responder assets. Map points can reference rescue zones now; future polygon
          boundaries will come from rescue zone GeoJSON.
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
          Rescue zone
          <select
            value={form.zone_id}
            onChange={(event) => setForm({ ...form, zone_id: event.target.value })}
          >
            <option value="">No zone</option>
            {rescueZones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.id} - {zone.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Legacy zone label
          <input
            value={form.zone}
            onChange={(event) => setForm({ ...form, zone: event.target.value })}
            placeholder="Optional fallback label"
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
                  {point.zone_id
                    ? ` - Zone ${point.zone_id}`
                    : point.zone
                      ? ` - ${point.zone}`
                      : ''}
                </p>
              </div>
              <span>{point.public_visible ? 'Public' : 'Responder'}</span>
            </article>
          ))}
          {mapPoints.length === 0 && <p className="muted">No map points loaded yet.</p>}
        </div>
      </section>

      <section className="action-card">
        <h2>Manage Resources</h2>
        <p className="muted">
          Primary boats are limited to Boat 11, Boat 78, and Boat 38.
        </p>
        <label>
          Resource id
          <input
            value={resourceForm.id}
            onChange={(event) => setResourceForm({ ...resourceForm, id: event.target.value })}
            placeholder="Example: boat-11"
          />
        </label>
        <label>
          Name
          <input
            value={resourceForm.name}
            onChange={(event) => setResourceForm({ ...resourceForm, name: event.target.value })}
            placeholder="Example: Boat 11"
          />
        </label>
        <label>
          Agency
          <input
            value={resourceForm.agency}
            onChange={(event) =>
              setResourceForm({ ...resourceForm, agency: event.target.value })
            }
          />
        </label>
        <div className="field-row">
          <label>
            Type
            <select
              value={resourceForm.resource_type}
              onChange={(event) =>
                setResourceForm({
                  ...resourceForm,
                  resource_type: event.target.value as ResourceType,
                })
              }
            >
              {resourceTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select
              value={resourceForm.status}
              onChange={(event) =>
                setResourceForm({
                  ...resourceForm,
                  status: event.target.value as ResourceStatus,
                })
              }
            >
              {resourceStatuses.map((resourceStatus) => (
                <option key={resourceStatus} value={resourceStatus}>
                  {resourceStatus}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button className="primary-action" type="button" onClick={handleSaveResource}>
          Save resource
        </button>
        <div className="point-list">
          {resources.map((resource) => (
            <article className="point-row" key={resource.id}>
              <div>
                <strong>{resource.name}</strong>
                <p>
                  {resource.agency} - {resource.resource_type} - {resource.status}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="action-card">
        <h2>Manage Agencies</h2>
        <label>
          Agency id
          <input
            value={agencyForm.id}
            onChange={(event) => setAgencyForm({ ...agencyForm, id: event.target.value })}
            placeholder="Example: bazetta-fire"
          />
        </label>
        <label>
          Name
          <input
            value={agencyForm.name}
            onChange={(event) => setAgencyForm({ ...agencyForm, name: event.target.value })}
          />
        </label>
        <label>
          Type
          <input
            value={agencyForm.agency_type}
            onChange={(event) =>
              setAgencyForm({ ...agencyForm, agency_type: event.target.value })
            }
            placeholder="Fire, EMS, Water Rescue, Mutual Aid"
          />
        </label>
        <button className="primary-action" type="button" onClick={handleSaveAgency}>
          Save agency
        </button>
        <div className="point-list">
          {agencies.map((agency) => (
            <article className="point-row" key={agency.id}>
              <div>
                <strong>{agency.name}</strong>
                <p>{agency.agency_type || 'Agency'}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="action-card">
        <h2>Rescue Zones</h2>
        <div className="chip-grid">
          {rescueZones.map((zone) => (
            <span key={zone.id}>
              Zone {zone.id}: {zone.name}
            </span>
          ))}
          <span>Categories</span>
          <span>Responder assets</span>
          <span>Water-visible points</span>
        </div>
      </section>

      {status && <p className="status-text">{status}</p>}
    </div>
  );
}
