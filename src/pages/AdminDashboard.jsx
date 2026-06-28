import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const EMPTY_FORM = { title: '', slug: '', excerpt: '', content: '' };

export default function AdminDashboard() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [editing, setEditing] = useState(null);     // null = closed, {} = new, {id, ...} = editing
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState(null);

  // Dialog ref
  const dialogRef = useRef(null);
  const mountedRef = useRef(true);
  const closeInitiatedByRef = useRef(null); // tracks who initiated close

  // ── Fetch posts ──
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!mountedRef.current) return;

    if (fetchError) setError(fetchError.message);
    else setPosts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchPosts();
    return () => { mountedRef.current = false; };
  }, [fetchPosts]);

  // ── Open/close dialog ──
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (editing !== null && !dialog.open) {
      dialog.showModal();
    } else if (editing === null && dialog.open) {
      closeInitiatedByRef.current = 'state';
      dialog.close();
    }
  }, [editing]);

  const handleDialogClose = () => {
    // ESC or backdrop click closed the dialog — sync React state.
    // Skip if we initiated the close to prevent a re-trigger loop.
    if (closeInitiatedByRef.current === 'state') {
      closeInitiatedByRef.current = null;
      return;
    }
    closeInitiatedByRef.current = null;
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  // ── Slug generation from title ──
  const slugify = (str) =>
    str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

  // ── Form handlers ──
  const openNew = () => {
    setEditing({});
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const openEdit = (post) => {
    setEditing(post);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content || '',
    });
    setFormError(null);
  };

  const closeForm = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const handleDialogClick = (e) => {
    // Backdrop click: dialog element itself was clicked, not its content
    if (e.target === dialogRef.current) closeForm();
  };

  const handleField = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'slug' ? slugify(value) : value,
    }));
  };

  const handleTitleBlur = () => {
    // Auto-generate slug from title if slug is empty or unchanged
    if (!form.slug || form.slug === slugify(form.title)) {
      setForm((prev) => ({ ...prev, slug: slugify(prev.title) }));
    }
  };

  // ── Save (create or update) ──
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      excerpt: form.excerpt.trim(),
      content: form.content.trim(),
    };

    if (!payload.title || !payload.slug) {
      setFormError('Title and slug are required.');
      setSaving(false);
      return;
    }

    let result;

    if (editing?.id) {
      // Update existing
      result = await supabase
        .from('posts')
        .update(payload)
        .eq('id', editing.id)
        .select()
        .single();
    } else {
      // Create new
      result = await supabase
        .from('posts')
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      setFormError(result.error.message);
      setSaving(false);
      return;
    }

    closeForm();
    setSaving(false);
    fetchPosts();
  };

  // ── Delete ──
  const handleDelete = async (id) => {
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      setDeletingId(null);
      fetchPosts();
    }
  };

  // ── Render ──
  return (
    <section className="admin">
      <header className="admin-header">
        <div>
          <h1>Dashboard</h1>
          <p className="admin-subtitle">
            Create, edit, and manage your blog posts.
          </p>
        </div>
        <button onClick={openNew} className="admin-new-btn">
          + New Post
        </button>
      </header>

      {error && (
        <div className="admin-error" role="alert" aria-live="polite">
          <p>Failed to load posts: {error}</p>
          <button className="admin-retry-btn" onClick={fetchPosts}>
            Try again
          </button>
        </div>
      )}

      {/* ── Post Form Dialog (create / edit) ── */}
      <dialog
        ref={dialogRef}
        className="admin-form-dialog"
        onClose={handleDialogClose}
        onClick={handleDialogClick}
        aria-labelledby="admin-form-heading"
      >
        <form className="admin-form" onSubmit={handleSave}>
          <h2 id="admin-form-heading">{editing?.id ? 'Edit Post' : 'New Post'}</h2>

          {formError && (
            <div className="admin-form-error" role="alert" aria-live="polite">
              {formError}
            </div>
          )}

          <label htmlFor="post-title">Title</label>
          <input
            id="post-title"
            name="title"
            type="text"
            value={form.title}
            onChange={handleField}
            onBlur={handleTitleBlur}
            placeholder="My awesome post"
            required
            aria-required="true"
            aria-invalid={!!formError}
            aria-describedby={formError ? 'admin-form-error' : undefined}
          />

          <label htmlFor="post-slug">Slug</label>
          <input
            id="post-slug"
            name="slug"
            type="text"
            value={form.slug}
            onChange={handleField}
            placeholder="my-awesome-post"
            required
            aria-required="true"
            aria-invalid={!!formError}
            aria-describedby={formError ? 'admin-form-error' : undefined}
          />

          <label htmlFor="post-excerpt">Excerpt</label>
          <textarea
            id="post-excerpt"
            name="excerpt"
            value={form.excerpt}
            onChange={handleField}
            rows={2}
            placeholder="A short summary…"
          />

          <label htmlFor="post-content">Content</label>
          <textarea
            id="post-content"
            name="content"
            value={form.content}
            onChange={handleField}
            rows={10}
            placeholder="Write your post here…"
          />

          {formError && <span id="admin-form-error" className="sr-only">{formError}</span>}

          <div className="admin-form-actions">
            <button type="submit" className="admin-save-btn" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" className="admin-cancel-btn" onClick={closeForm}>
              Cancel
            </button>
          </div>
        </form>
      </dialog>

      {/* ── Post List ── */}
      {loading && <p className="loading" aria-live="polite">Loading posts…</p>}

      {!loading && !error && posts.length === 0 && (
        <div className="admin-empty">
          <p>No posts yet. Click "New Post" to get started.</p>
        </div>
      )}

      {!loading && !error && posts.length > 0 && (
        <ul className="admin-list">
          {posts.map((post) => (
            <li key={post.id} className="admin-list-item">
              <div className="admin-list-info">
                <h3>{post.title}</h3>
                <span className="admin-list-meta">
                  /{post.slug} · {new Date(post.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="admin-list-actions">
                {deletingId === post.id ? (
                  <>
                    <span className="admin-delete-confirm">Delete?</span>
                    <button
                      className="admin-delete-yes"
                      onClick={() => handleDelete(post.id)}
                      aria-label={`Confirm delete "${post.title}"`}
                    >
                      Yes
                    </button>
                    <button
                      className="admin-delete-no"
                      onClick={() => setDeletingId(null)}
                      aria-label="Cancel delete"
                    >
                      No
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="admin-edit-btn"
                      onClick={() => openEdit(post)}
                      aria-label={`Edit "${post.title}"`}
                    >
                      Edit
                    </button>
                    <button
                      className="admin-delete-btn"
                      onClick={() => setDeletingId(post.id)}
                      aria-label={`Delete "${post.title}"`}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
