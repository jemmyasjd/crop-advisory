import { useMemo, useState } from 'react';
import { Formik, Form } from 'formik';
import { toast } from 'react-toastify';
import DataTable from './DataTable';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import useFetch from '../hooks/useFetch';

/**
 * Generic CRUD page: list (table) + create/edit modal (Formik+Yup) + delete confirm.
 *
 * @param {object} props
 * @param {string} props.title
 * @param {string} props.singular              - label for buttons ("Crop")
 * @param {object} props.api                   - { list, create, update, remove }
 * @param {Array}  props.columns               - DataTable columns
 * @param {(row)=>object} props.toInitialValues- map a row (or undefined) to Formik initial values
 * @param {object} props.validationSchema      - Yup schema
 * @param {(values)=>object} [props.toPayload] - map form values to API payload
 * @param {(formik)=>ReactNode} props.fields   - render form fields (receives formik bag)
 * @param {(row)=>string} [props.rowName]      - label used in delete confirmation
 * @param {string[]} [props.searchKeys]        - row keys to filter on
 * @param {boolean} [props.canCreate=true]
 * @param {boolean} [props.canEdit=true]
 * @param {boolean} [props.canDelete=true]
 */
export default function CrudPage({
  title,
  singular,
  api,
  columns,
  toInitialValues,
  validationSchema,
  toPayload = (v) => v,
  fields,
  rowName = (r) => `#${r.id}`,
  searchKeys = [],
  canCreate = true,
  canEdit = true,
  canDelete = true,
  extra,
}) {
  const { data, loading, reload } = useFetch(() => api.list(), [title]);
  const rows = data || [];

  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // row | {} (new) | null
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    if (!search || !searchKeys.length) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) =>
      searchKeys.some((k) => String(r[k] ?? '').toLowerCase().includes(q))
    );
  }, [rows, search, searchKeys]);

  const isNew = editing && !editing.id;

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const payload = toPayload(values);
      if (isNew) {
        await api.create(payload);
        toast.success(`${singular} created`);
      } else {
        await api.update(editing.id, payload);
        toast.success(`${singular} updated`);
      }
      setEditing(null);
      reload();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await api.remove(deleting.id);
      toast.success(`${singular} deleted`);
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  const actions = (canEdit || canDelete) ? (row) => (
    <>
      {canEdit && (
        <button className="btn btn-secondary btn-sm" onClick={() => setEditing(row)}>
          Edit
        </button>
      )}
      {canDelete && (
        <button className="btn btn-danger btn-sm" onClick={() => setDeleting(row)}>
          Delete
        </button>
      )}
    </>
  ) : undefined;

  return (
    <div className="card">
      <div className="card-header">
        <h2>{title}</h2>
        <div className="toolbar">
          {searchKeys.length > 0 && (
            <input
              className="form-control search-input"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}
          {canCreate && (
            <button className="btn btn-primary" onClick={() => setEditing({})}>
              + New {singular}
            </button>
          )}
        </div>
      </div>

      <div className="card-body">
        {extra}
        <DataTable columns={columns} rows={filtered} loading={loading} actions={actions} />
      </div>

      {editing && (
        <Formik
          initialValues={toInitialValues(editing)}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {(formik) => (
            <Modal
              title={`${isNew ? 'Create' : 'Edit'} ${singular}`}
              onClose={() => setEditing(null)}
              footer={
                <>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEditing(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="crud-form"
                    className="btn btn-primary"
                    disabled={formik.isSubmitting}
                  >
                    {formik.isSubmitting ? 'Saving…' : 'Save'}
                  </button>
                </>
              }
            >
              <Form id="crud-form">{fields(formik)}</Form>
            </Modal>
          )}
        </Formik>
      )}

      {deleting && (
        <ConfirmDialog
          title={`Delete ${singular}`}
          message={`Are you sure you want to delete ${rowName(deleting)}? This cannot be undone.`}
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
          busy={busy}
        />
      )}
    </div>
  );
}
