import { useEffect, useState } from 'react';
import {
  closeIncident,
  createIncident,
  loadIncidentMarkers,
  loadIncidents,
  saveIncidentMarker,
  updateIncidentCommandNotes,
  updateIncidentStatus,
} from '../services/incidents';
import type {
  Coordinates,
  Incident,
  IncidentMarker,
  IncidentMarkerType,
  IncidentStatus,
  WaterRescueIncidentType,
} from '../types';

const markerTypes: IncidentMarkerType[] = [
  'Last Known Position',
  'Point Last Seen',
  'Sonar Contact',
  'Hazard',
  'Victim Located',
  'Evidence / Item Found',
  'Diver Entry',
  'Boat Staging',
  'Command Post',
  'Search Assignment',
];

const incidentStatuses: IncidentStatus[] = [
  'Active',
  'Standby',
  'Closed',
];

const incidentTypes: WaterRescueIncidentType[] = [
  'Missing swimmer',
  'Missing boater',
  'Capsized vessel',
  'Medical emergency',
  'Recovery operation',
  'Search only',
];

export function ResponderInterface({
  pendingDrop,
  onPendingDropChange,
  onMarkersLoaded,
  onMarkerSaved,
}: {
  pendingDrop: Coordinates | null;
  onPendingDropChange: (coordinates: Coordinates | null) => void;
  onMarkersLoaded: (markers: IncidentMarker[]) => void;
  onMarkerSaved: (marker: IncidentMarker) => void;
}) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState('');
  const [incidentName, setIncidentName] = useState('');
  const [incidentType, setIncidentType] = useState<WaterRescueIncidentType>('Search only');
  const [tc911RunNumber, setTc911RunNumber] = useState('');
  const [newIncidentCommandNotes, setNewIncidentCommandNotes] = useState('');
  const [commandNotes, setCommandNotes] = useState('');
  const [markerType, setMarkerType] = useState<IncidentMarkerType>('Last Known Position');
  const [markerNotes, setMarkerNotes] = useState('');
  const [closeoutNotes, setCloseoutNotes] = useState('');
  const [archiveSearch, setArchiveSearch] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const selectedIncident = incidents.find((incident) => incident.id === selectedIncidentId);
  const archivedIncidents = incidents
    .filter((incident) => incident.status === 'Closed')
    .filter((incident) => {
      const search = archiveSearch.trim().toLowerCase();

      if (!search) {
        return true;
      }

      return [
        incident.name,
        incident.incident_type,
        incident.tc911_run_number,
        incident.command_notes,
        incident.closeout_notes,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    });
  const activeIncidents = incidents.filter((incident) => incident.status !== 'Closed');

  const refreshIncidents = async () => {
    const nextIncidents = await loadIncidents(true);
    setIncidents(nextIncidents);
    if (!selectedIncidentId && nextIncidents[0]) {
      setSelectedIncidentId(nextIncidents[0].id);
    }
  };

  useEffect(() => {
    refreshIncidents().catch((error: Error) => setStatus(error.message));
  }, []);

  useEffect(() => {
    setCommandNotes(selectedIncident?.command_notes ?? '');
  }, [selectedIncident?.id, selectedIncident?.command_notes]);

  useEffect(() => {
    loadIncidentMarkers(selectedIncidentId || undefined)
      .then(onMarkersLoaded)
      .catch((error: Error) => setStatus(error.message));
  }, [onMarkersLoaded, selectedIncidentId]);

  const handleCreateIncident = async () => {
    if (!incidentName.trim()) {
      setStatus('Add an incident name.');
      return;
    }

    try {
      const incident = await createIncident({
        name: incidentName.trim(),
        incident_type: incidentType,
        tc911_run_number: tc911RunNumber.trim() || null,
        command_notes: newIncidentCommandNotes.trim() || null,
      });
      setIncidents((current) => [incident, ...current]);
      setSelectedIncidentId(incident.id);
      setIncidentName('');
      setIncidentType('Search only');
      setTc911RunNumber('');
      setNewIncidentCommandNotes('');
      setStatus('Incident created.');
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  const handleSaveMarker = async () => {
    if (!selectedIncidentId || !pendingDrop) {
      setStatus('Select an incident and tap the map to place a marker.');
      return;
    }

    try {
      const marker = await saveIncidentMarker({
        incident_id: selectedIncidentId,
        marker_type: markerType,
        latitude: pendingDrop.latitude,
        longitude: pendingDrop.longitude,
        notes: markerNotes.trim() || undefined,
      });
      onMarkerSaved(marker);
      onPendingDropChange(null);
      setMarkerNotes('');
      setStatus('Marker saved to incident.');
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  const handleStatusChange = async (nextStatus: IncidentStatus) => {
    if (!selectedIncidentId) {
      return;
    }

    try {
      const updated = await updateIncidentStatus(selectedIncidentId, nextStatus);
      setIncidents((current) =>
        current.map((incident) => (incident.id === updated.id ? updated : incident)),
      );
      setStatus(`Incident status changed to ${nextStatus}.`);
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  const handleSaveCommandNotes = async () => {
    if (!selectedIncidentId) {
      setStatus('Select an incident before saving command notes.');
      return;
    }

    try {
      const updated = await updateIncidentCommandNotes(selectedIncidentId, commandNotes);
      setIncidents((current) =>
        current.map((incident) => (incident.id === updated.id ? updated : incident)),
      );
      setStatus('Command notes saved.');
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  const publicIncidentLink =
    selectedIncident?.public_share_token && typeof window !== 'undefined'
      ? `${window.location.origin}/?incident=${selectedIncident.public_share_token}`
      : '';

  const handleCloseIncident = async () => {
    if (!selectedIncidentId || !closeoutNotes.trim()) {
      setStatus('Closeout notes are required before closing an incident.');
      return;
    }

    try {
      const closed = await closeIncident(selectedIncidentId, closeoutNotes.trim());
      setIncidents((current) =>
        current.map((incident) => (incident.id === closed.id ? closed : incident)),
      );
      setCloseoutNotes('');
      setStatus('Incident closed and archived.');
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  return (
    <div className="panel-stack">
      <section className="action-card">
        <h2>Responder Access</h2>
        <p className="muted">
          Login-ready view for TCWRT, Bazetta Fire, Mecca Fire, and Trumbull County 911.
          Authentication can be attached through Supabase Auth without changing this screen.
        </p>
      </section>

      <section className="action-card">
        <h2>Active Incidents</h2>
        <p className="muted">{activeIncidents.length} active or standby incident(s) loaded.</p>
        <label>
          Select incident
          <select
            value={selectedIncidentId}
            onChange={(event) => setSelectedIncidentId(event.target.value)}
          >
            <option value="">No incident selected</option>
            {incidents.map((incident) => (
              <option key={incident.id} value={incident.id}>
                {incident.name} - {incident.incident_type} - {incident.status}
              </option>
            ))}
          </select>
        </label>

        {selectedIncident && (
          <div className="result-box">
            <p>
              <strong>Status:</strong> {selectedIncident.status}
            </p>
            <p>
              <strong>Type:</strong> {selectedIncident.incident_type}
            </p>
            <p>
              <strong>TC911 run number:</strong>{' '}
              {selectedIncident.tc911_run_number || 'Not entered'}
            </p>
            {selectedIncident.closed_at && (
              <p>
                <strong>Closed:</strong> {new Date(selectedIncident.closed_at).toLocaleString()}
              </p>
            )}
          </div>
        )}

        <label>
          Update status
          <select
            value={selectedIncident?.status ?? 'Active'}
            disabled={!selectedIncident}
            onChange={(event) => handleStatusChange(event.target.value as IncidentStatus)}
          >
            {incidentStatuses.map((incidentStatus) => (
              <option key={incidentStatus} value={incidentStatus}>
                {incidentStatus}
              </option>
            ))}
          </select>
        </label>

        <label>
          New incident name
          <input
            value={incidentName}
            onChange={(event) => setIncidentName(event.target.value)}
            placeholder="Example: North basin overdue boat"
          />
        </label>
        <label>
          Water rescue incident type
          <select
            value={incidentType}
            onChange={(event) =>
              setIncidentType(event.target.value as WaterRescueIncidentType)
            }
          >
            {incidentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label>
          TC911 run number
          <input
            value={tc911RunNumber}
            onChange={(event) => setTc911RunNumber(event.target.value)}
            placeholder="Assigned by Trumbull County 911"
          />
        </label>
        <label>
          Incident command notes
          <textarea
            value={newIncidentCommandNotes}
            onChange={(event) => setNewIncidentCommandNotes(event.target.value)}
            placeholder="Command channel, staging, assignments, safety notes"
          />
        </label>
        <button className="primary-action" type="button" onClick={handleCreateIncident}>
          Create incident
        </button>
      </section>

      <section className="action-card">
        <h2>Incident Command Notes</h2>
        <label>
          Notes for selected incident
          <textarea
            value={commandNotes}
            onChange={(event) => setCommandNotes(event.target.value)}
            placeholder={
              selectedIncident?.command_notes || 'Command post updates, agencies, assignments'
            }
          />
        </label>
        <button className="secondary-action" type="button" onClick={handleSaveCommandNotes}>
          Save command notes
        </button>
        {publicIncidentLink && (
          <div className="result-box">
            <p>
              <strong>Shareable public map link:</strong>
            </p>
            <p>{publicIncidentLink}</p>
            <button
              className="secondary-action"
              type="button"
              onClick={() => navigator.clipboard.writeText(publicIncidentLink)}
            >
              Copy public map link
            </button>
          </div>
        )}
      </section>

      <section className="action-card">
        <h2>Tap / Drop Marker</h2>
        <p className="muted">Tap the map, choose the marker type, add notes, then save.</p>
        <label>
          Marker type
          <select
            value={markerType}
            onChange={(event) => setMarkerType(event.target.value as IncidentMarkerType)}
          >
            {markerTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        {pendingDrop && (
          <div className="result-box">
            Pending: {pendingDrop.latitude.toFixed(6)}, {pendingDrop.longitude.toFixed(6)}
          </div>
        )}
        <label>
          Marker notes
          <textarea
            value={markerNotes}
            onChange={(event) => setMarkerNotes(event.target.value)}
            placeholder="Observed by, time, conditions, assignment details"
          />
        </label>
        <button className="primary-action" type="button" onClick={handleSaveMarker}>
          Save marker
        </button>
      </section>

      <section className="action-card">
        <h2>Close / Archive Incident</h2>
        <label>
          Closeout notes
          <textarea
            value={closeoutNotes}
            onChange={(event) => setCloseoutNotes(event.target.value)}
            placeholder="Outcome, agencies, resources, follow-up"
          />
        </label>
        <button className="secondary-action" type="button" onClick={handleCloseIncident}>
          Close incident
        </button>
      </section>

      <section className="action-card">
        <h2>Archived Incident History</h2>
        <label>
          Search archive
          <input
            value={archiveSearch}
            onChange={(event) => setArchiveSearch(event.target.value)}
            placeholder="Search name, type, TC911 run number, notes"
          />
        </label>
        <div className="point-list">
          {archivedIncidents.map((incident) => (
            <article className="point-row" key={incident.id}>
              <div>
                <strong>{incident.name}</strong>
                <p>
                  {incident.incident_type} - {incident.status}
                  {incident.tc911_run_number ? ` - ${incident.tc911_run_number}` : ''}
                </p>
              </div>
              <span>{incident.closed_at ? new Date(incident.closed_at).toLocaleDateString() : 'Archived'}</span>
            </article>
          ))}
          {archivedIncidents.length === 0 && (
            <p className="muted">No closed incidents match this search.</p>
          )}
        </div>
      </section>

      {status && <p className="status-text">{status}</p>}
    </div>
  );
}
