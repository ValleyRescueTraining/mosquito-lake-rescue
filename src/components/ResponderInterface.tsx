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
import {
  addActivityLogEntry,
  assignResourceToIncident,
  loadActivityLog,
  loadAssignments,
  loadEvidenceItems,
  loadResources,
  loadRoleAssignments,
  saveAssignment,
  saveEvidenceItem,
  saveRoleAssignment,
  updateAssignmentStatus,
  updateResourceStatus,
} from '../services/operations';
import type {
  ActivityActionType,
  AssignmentStatus,
  AssignmentType,
  Coordinates,
  EvidenceItem,
  Incident,
  IncidentActivityLogEntry,
  IncidentMarker,
  IncidentMarkerType,
  IncidentRoleAssignment,
  IncidentRoleName,
  IncidentStatus,
  Resource,
  ResourceStatus,
  RescueZone,
  SearchAssignment,
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

const incidentStatuses: IncidentStatus[] = ['Active', 'Standby', 'Closed'];

const incidentTypes: WaterRescueIncidentType[] = [
  'Missing swimmer',
  'Missing boater',
  'Capsized vessel',
  'Medical emergency',
  'Recovery operation',
  'Search only',
];

const resourceStatuses: ResourceStatus[] = [
  'Available',
  'Assigned',
  'En Route',
  'On Scene',
  'Searching',
  'Returning',
  'Out of Service',
];

const assignmentTypes: AssignmentType[] = [
  'Boat Search',
  'Shore Search',
  'Sonar Search',
  'Dive Assignment',
  'Medical Standby',
  'Staging',
  'Transport',
  'Other',
];

const assignmentStatuses: AssignmentStatus[] = [
  'Assigned',
  'In Progress',
  'Completed',
  'Suspended',
];

const roleNames: IncidentRoleName[] = [
  'Incident Commander',
  'Operations',
  'Boat Operations',
  'Dive Operations',
  'Sonar Operations',
  'Safety',
  'Staging',
  'Medical',
  'Communications',
  'Liaison',
  'PIO',
];

const logAction = async (
  incidentId: string | undefined,
  actionType: ActivityActionType,
  summary: string,
  details?: Record<string, unknown>,
) => {
  if (!incidentId) {
    return;
  }

  await addActivityLogEntry({
    incident_id: incidentId,
    action_type: actionType,
    summary,
    details,
  });
};

export function ResponderInterface({
  rescueZones,
  pendingDrop,
  onPendingDropChange,
  onMarkersLoaded,
  onMarkerSaved,
}: {
  rescueZones: RescueZone[];
  pendingDrop: Coordinates | null;
  onPendingDropChange: (coordinates: Coordinates | null) => void;
  onMarkersLoaded: (markers: IncidentMarker[]) => void;
  onMarkerSaved: (marker: IncidentMarker) => void;
}) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [assignments, setAssignments] = useState<SearchAssignment[]>([]);
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [roleAssignments, setRoleAssignments] = useState<IncidentRoleAssignment[]>([]);
  const [activityLog, setActivityLog] = useState<IncidentActivityLogEntry[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState('');
  const [incidentName, setIncidentName] = useState('');
  const [incidentType, setIncidentType] = useState<WaterRescueIncidentType>('Search only');
  const [tc911RunNumber, setTc911RunNumber] = useState('');
  const [newIncidentCommandNotes, setNewIncidentCommandNotes] = useState('');
  const [commandNotes, setCommandNotes] = useState('');
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [resourceStatus, setResourceStatus] = useState<ResourceStatus>('Assigned');
  const [resourceZoneId, setResourceZoneId] = useState('');
  const [assignmentDraft, setAssignmentDraft] = useState({
    assignment_type: 'Boat Search' as AssignmentType,
    assigned_resource_id: '',
    zone_id: '',
    priority: '1',
    notes: '',
  });
  const [completionNotes, setCompletionNotes] = useState('');
  const [roleDraft, setRoleDraft] = useState({
    role_name: 'Incident Commander' as IncidentRoleName,
    assigned_resource_id: '',
    assigned_person_name: '',
    notes: '',
  });
  const [evidenceDraft, setEvidenceDraft] = useState({
    item_type: '',
    description: '',
    found_by: '',
    custody_notes: '',
  });
  const [markerType, setMarkerType] = useState<IncidentMarkerType>('Last Known Position');
  const [markerNotes, setMarkerNotes] = useState('');
  const [closeoutNotes, setCloseoutNotes] = useState('');
  const [archiveSearch, setArchiveSearch] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const selectedIncident = incidents.find((incident) => incident.id === selectedIncidentId);
  const activeIncidents = incidents.filter((incident) => incident.status !== 'Closed');
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

  const refreshIncidents = async () => {
    const nextIncidents = await loadIncidents(true);
    setIncidents(nextIncidents);
    if (!selectedIncidentId && nextIncidents[0]) {
      setSelectedIncidentId(nextIncidents[0].id);
    }
  };

  const refreshOperations = async (incidentId?: string) => {
    const [
      nextResources,
      nextAssignments,
      nextEvidenceItems,
      nextRoles,
      nextActivityLog,
      nextMarkers,
    ] = await Promise.all([
      loadResources(),
      loadAssignments(incidentId),
      loadEvidenceItems(incidentId),
      loadRoleAssignments(incidentId),
      loadActivityLog(incidentId),
      loadIncidentMarkers(incidentId),
    ]);

    setResources(nextResources);
    setAssignments(nextAssignments);
    setEvidenceItems(nextEvidenceItems);
    setRoleAssignments(nextRoles);
    setActivityLog(nextActivityLog);
    onMarkersLoaded(nextMarkers);
  };

  useEffect(() => {
    refreshIncidents().catch((error: Error) => setStatus(error.message));
    refreshOperations().catch((error: Error) => setStatus(error.message));
  }, []);

  useEffect(() => {
    setCommandNotes(selectedIncident?.command_notes ?? '');
    refreshOperations(selectedIncidentId || undefined).catch((error: Error) =>
      setStatus(error.message),
    );
  }, [selectedIncident?.id, selectedIncident?.command_notes, selectedIncidentId]);

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
      await logAction(incident.id, 'Incident created', `Incident created: ${incident.name}`);
      setIncidents((current) => [incident, ...current]);
      setSelectedIncidentId(incident.id);
      setIncidentName('');
      setIncidentType('Search only');
      setTc911RunNumber('');
      setNewIncidentCommandNotes('');
      setStatus('Incident created.');
      await refreshOperations(incident.id);
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
      await logAction(
        selectedIncidentId,
        'Incident status changed',
        `Incident status changed to ${nextStatus}`,
      );
      setIncidents((current) =>
        current.map((incident) => (incident.id === updated.id ? updated : incident)),
      );
      setStatus(`Incident status changed to ${nextStatus}.`);
      await refreshOperations(selectedIncidentId);
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
      await logAction(selectedIncidentId, 'Notes added', 'Incident command notes updated');
      setIncidents((current) =>
        current.map((incident) => (incident.id === updated.id ? updated : incident)),
      );
      setStatus('Command notes saved.');
      await refreshOperations(selectedIncidentId);
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  const handleAssignResource = async () => {
    if (!selectedIncidentId || !selectedResourceId) {
      setStatus('Select an incident and resource.');
      return;
    }

    try {
      const resource = await assignResourceToIncident(
        selectedResourceId,
        selectedIncidentId,
        resourceStatus,
        resourceZoneId || null,
      );
      await logAction(
        selectedIncidentId,
        'Resource assigned',
        `${resource.name} assigned to incident`,
        { resource_id: resource.id, status: resource.status },
      );
      setStatus('Resource assignment updated.');
      await refreshOperations(selectedIncidentId);
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  const handleResourceStatusChange = async (resourceId: string, nextStatus: ResourceStatus) => {
    try {
      const resource = await updateResourceStatus(resourceId, nextStatus);
      await logAction(
        resource.current_incident_id ?? selectedIncidentId,
        'Resource status changed',
        `${resource.name} status changed to ${nextStatus}`,
      );
      await refreshOperations(selectedIncidentId || undefined);
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  const handleCreateAssignment = async () => {
    if (!selectedIncidentId) {
      setStatus('Select an incident before creating an assignment.');
      return;
    }

    try {
      const assignment = await saveAssignment({
        incident_id: selectedIncidentId,
        assignment_type: assignmentDraft.assignment_type,
        assigned_resource_id: assignmentDraft.assigned_resource_id || null,
        zone_id: assignmentDraft.zone_id || null,
        priority: Number(assignmentDraft.priority) || null,
        status: 'Assigned',
        start_time: new Date().toISOString(),
        notes: assignmentDraft.notes || null,
      });
      await logAction(
        selectedIncidentId,
        'Search task created',
        `${assignment.assignment_type} assignment created`,
        { assignment_id: assignment.id },
      );
      setAssignmentDraft({
        assignment_type: 'Boat Search',
        assigned_resource_id: '',
        zone_id: '',
        priority: '1',
        notes: '',
      });
      setStatus('Assignment created.');
      await refreshOperations(selectedIncidentId);
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  const handleAssignmentStatusChange = async (
    assignment: SearchAssignment,
    nextStatus: AssignmentStatus,
  ) => {
    try {
      await updateAssignmentStatus(
        assignment.id,
        nextStatus,
        nextStatus === 'Completed' ? completionNotes : undefined,
      );
      await logAction(
        assignment.incident_id,
        nextStatus === 'Completed' ? 'Search task completed' : 'Notes added',
        `${assignment.assignment_type} status changed to ${nextStatus}`,
      );
      setCompletionNotes('');
      await refreshOperations(selectedIncidentId || undefined);
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  const handleSaveRole = async () => {
    if (!selectedIncidentId) {
      setStatus('Select an incident before assigning a role.');
      return;
    }

    try {
      await saveRoleAssignment({
        incident_id: selectedIncidentId,
        role_name: roleDraft.role_name,
        assigned_resource_id: roleDraft.assigned_resource_id || null,
        assigned_person_name: roleDraft.assigned_person_name || null,
        notes: roleDraft.notes || null,
      });
      await logAction(
        selectedIncidentId,
        'Role assigned',
        `${roleDraft.role_name} assigned`,
        {
          role_name: roleDraft.role_name,
          assigned_resource_id: roleDraft.assigned_resource_id || null,
          assigned_person_name: roleDraft.assigned_person_name || null,
        },
      );
      setRoleDraft({
        role_name: 'Incident Commander',
        assigned_resource_id: '',
        assigned_person_name: '',
        notes: '',
      });
      setStatus('Role assignment saved.');
      await refreshOperations(selectedIncidentId);
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
      await logAction(
        selectedIncidentId,
        'Marker added',
        `${marker.marker_type} marker added`,
        { marker_id: marker.id },
      );
      onMarkerSaved(marker);
      onPendingDropChange(null);
      setMarkerNotes('');
      setStatus('Marker saved to incident.');
      await refreshOperations(selectedIncidentId);
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  const handleSaveEvidence = async () => {
    if (!selectedIncidentId || !evidenceDraft.item_type.trim()) {
      setStatus('Select an incident and enter an item type.');
      return;
    }

    try {
      const evidence = await saveEvidenceItem({
        incident_id: selectedIncidentId,
        item_type: evidenceDraft.item_type.trim(),
        description: evidenceDraft.description || null,
        found_by: evidenceDraft.found_by || null,
        found_at: new Date().toISOString(),
        latitude: pendingDrop?.latitude ?? null,
        longitude: pendingDrop?.longitude ?? null,
        custody_notes: evidenceDraft.custody_notes || null,
      });
      await logAction(
        selectedIncidentId,
        'Evidence/clue added',
        `Evidence/clue added: ${evidence.item_type}`,
        { evidence_id: evidence.id },
      );
      setEvidenceDraft({ item_type: '', description: '', found_by: '', custody_notes: '' });
      setStatus('Evidence/clue saved.');
      await refreshOperations(selectedIncidentId);
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  const handleCloseIncident = async () => {
    if (!selectedIncidentId || !closeoutNotes.trim()) {
      setStatus('Closeout notes are required before closing an incident.');
      return;
    }

    try {
      const closed = await closeIncident(selectedIncidentId, closeoutNotes.trim());
      await logAction(selectedIncidentId, 'Incident closed', 'Incident closed with notes');
      setIncidents((current) =>
        current.map((incident) => (incident.id === closed.id ? closed : incident)),
      );
      setCloseoutNotes('');
      setStatus('Incident closed and archived.');
      await refreshOperations(selectedIncidentId);
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  const publicIncidentLink =
    selectedIncident?.public_share_token && typeof window !== 'undefined'
      ? `${window.location.origin}/?incident=${selectedIncident.public_share_token}`
      : '';

  return (
    <div className="panel-stack">
      <section className="action-card">
        <h2>Active Incident</h2>
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
              <strong>TC911:</strong> {selectedIncident.tc911_run_number || 'Not entered'}
            </p>
            <p>
              <strong>Status:</strong> {selectedIncident.status}
            </p>
            <p>
              <strong>Type:</strong> {selectedIncident.incident_type}
            </p>
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
            placeholder="Example: North lake missing boater"
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
        <h2>Resource Board</h2>
        <label>
          Resource
          <select
            value={selectedResourceId}
            onChange={(event) => setSelectedResourceId(event.target.value)}
          >
            <option value="">Select resource</option>
            {resources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.name} / {resource.agency} / {resource.status}
              </option>
            ))}
          </select>
        </label>
        <div className="field-row">
          <label>
            Status
            <select
              value={resourceStatus}
              onChange={(event) => setResourceStatus(event.target.value as ResourceStatus)}
            >
              {resourceStatuses.map((nextStatus) => (
                <option key={nextStatus} value={nextStatus}>
                  {nextStatus}
                </option>
              ))}
            </select>
          </label>
          <label>
            Zone
            <select
              value={resourceZoneId}
              onChange={(event) => setResourceZoneId(event.target.value)}
            >
              <option value="">No zone</option>
              {rescueZones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.id} - {zone.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button className="primary-action" type="button" onClick={handleAssignResource}>
          Assign / update resource
        </button>
        <div className="point-list">
          {resources.map((resource) => (
            <article key={resource.id} className="point-row">
              <div>
                <strong>{resource.name}</strong>
                <p>
                  {resource.agency} - {resource.resource_type}
                  {resource.assigned_zone_id ? ` - Zone ${resource.assigned_zone_id}` : ''}
                </p>
              </div>
              <select
                value={resource.status}
                onChange={(event) =>
                  handleResourceStatusChange(resource.id, event.target.value as ResourceStatus)
                }
              >
                {resourceStatuses.map((nextStatus) => (
                  <option key={nextStatus} value={nextStatus}>
                    {nextStatus}
                  </option>
                ))}
              </select>
            </article>
          ))}
        </div>
      </section>

      <section className="action-card">
        <h2>Optional Roles</h2>
        <p className="muted">Roles are optional. Small incidents may only fill command and operations.</p>
        <label>
          Role
          <select
            value={roleDraft.role_name}
            onChange={(event) =>
              setRoleDraft({ ...roleDraft, role_name: event.target.value as IncidentRoleName })
            }
          >
            {roleNames.map((roleName) => (
              <option key={roleName} value={roleName}>
                {roleName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Assigned resource
          <select
            value={roleDraft.assigned_resource_id}
            onChange={(event) =>
              setRoleDraft({ ...roleDraft, assigned_resource_id: event.target.value })
            }
          >
            <option value="">No resource</option>
            {resources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Person name
          <input
            value={roleDraft.assigned_person_name}
            onChange={(event) =>
              setRoleDraft({ ...roleDraft, assigned_person_name: event.target.value })
            }
          />
        </label>
        <button className="secondary-action" type="button" onClick={handleSaveRole}>
          Save role
        </button>
        <div className="point-list">
          {roleAssignments.map((role) => (
            <article className="point-row" key={role.id}>
              <div>
                <strong>{role.role_name}</strong>
                <p>{role.assigned_person_name || role.assigned_resource_id || 'Unfilled'}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="action-card">
        <h2>Assignments</h2>
        <label>
          Assignment type
          <select
            value={assignmentDraft.assignment_type}
            onChange={(event) =>
              setAssignmentDraft({
                ...assignmentDraft,
                assignment_type: event.target.value as AssignmentType,
              })
            }
          >
            {assignmentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <div className="field-row">
          <label>
            Resource
            <select
              value={assignmentDraft.assigned_resource_id}
              onChange={(event) =>
                setAssignmentDraft({
                  ...assignmentDraft,
                  assigned_resource_id: event.target.value,
                })
              }
            >
              <option value="">Unassigned</option>
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Zone
            <select
              value={assignmentDraft.zone_id}
              onChange={(event) =>
                setAssignmentDraft({ ...assignmentDraft, zone_id: event.target.value })
              }
            >
              <option value="">No zone</option>
              {rescueZones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.id} - {zone.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Priority
          <input
            value={assignmentDraft.priority}
            onChange={(event) =>
              setAssignmentDraft({ ...assignmentDraft, priority: event.target.value })
            }
            inputMode="numeric"
          />
        </label>
        <label>
          Assignment notes
          <textarea
            value={assignmentDraft.notes}
            onChange={(event) =>
              setAssignmentDraft({ ...assignmentDraft, notes: event.target.value })
            }
          />
        </label>
        <button className="primary-action" type="button" onClick={handleCreateAssignment}>
          Create assignment
        </button>
        <label>
          Completion notes
          <textarea
            value={completionNotes}
            onChange={(event) => setCompletionNotes(event.target.value)}
            placeholder="Result, coverage, hazards, follow-up"
          />
        </label>
        <div className="point-list">
          {assignments.map((assignment) => (
            <article className="point-row" key={assignment.id}>
              <div>
                <strong>{assignment.assignment_type}</strong>
                <p>
                  {assignment.status}
                  {assignment.zone_id ? ` - Zone ${assignment.zone_id}` : ''}
                </p>
              </div>
              <select
                value={assignment.status}
                onChange={(event) =>
                  handleAssignmentStatusChange(
                    assignment,
                    event.target.value as AssignmentStatus,
                  )
                }
              >
                {assignmentStatuses.map((nextStatus) => (
                  <option key={nextStatus} value={nextStatus}>
                    {nextStatus}
                  </option>
                ))}
              </select>
            </article>
          ))}
        </div>
      </section>

      <section className="action-card">
        <h2>Map Markers</h2>
        <p className="muted">Tap the map, choose a marker type, add notes, then save.</p>
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
          />
        </label>
        <button className="primary-action" type="button" onClick={handleSaveMarker}>
          Save marker
        </button>
      </section>

      <section className="action-card">
        <h2>Evidence / Clues</h2>
        <label>
          Item type
          <input
            value={evidenceDraft.item_type}
            onChange={(event) =>
              setEvidenceDraft({ ...evidenceDraft, item_type: event.target.value })
            }
            placeholder="Example: life jacket, paddle, clothing"
          />
        </label>
        <label>
          Description
          <textarea
            value={evidenceDraft.description}
            onChange={(event) =>
              setEvidenceDraft({ ...evidenceDraft, description: event.target.value })
            }
          />
        </label>
        <label>
          Found by
          <input
            value={evidenceDraft.found_by}
            onChange={(event) =>
              setEvidenceDraft({ ...evidenceDraft, found_by: event.target.value })
            }
          />
        </label>
        <label>
          Custody notes
          <textarea
            value={evidenceDraft.custody_notes}
            onChange={(event) =>
              setEvidenceDraft({ ...evidenceDraft, custody_notes: event.target.value })
            }
          />
        </label>
        <button className="secondary-action" type="button" onClick={handleSaveEvidence}>
          Save evidence / clue
        </button>
        <div className="point-list">
          {evidenceItems.map((item) => (
            <article className="point-row" key={item.id}>
              <div>
                <strong>{item.item_type}</strong>
                <p>{item.description || item.found_by || 'No description'}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="action-card">
        <h2>Incident Command Notes</h2>
        <label>
          Notes for selected incident
          <textarea
            value={commandNotes}
            onChange={(event) => setCommandNotes(event.target.value)}
            placeholder="Command post updates, agencies, assignments"
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
          </div>
        )}
      </section>

      <section className="action-card">
        <h2>Activity Log</h2>
        <div className="point-list">
          {activityLog.map((entry) => (
            <article className="point-row" key={entry.id}>
              <div>
                <strong>{entry.action_type}</strong>
                <p>{entry.summary}</p>
              </div>
              <span>
                {entry.created_at ? new Date(entry.created_at).toLocaleTimeString() : 'Now'}
              </span>
            </article>
          ))}
          {activityLog.length === 0 && <p className="muted">No activity logged yet.</p>}
        </div>
      </section>

      <section className="action-card">
        <h2>Closeout</h2>
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
              <span>
                {incident.closed_at
                  ? new Date(incident.closed_at).toLocaleDateString()
                  : 'Archived'}
              </span>
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
