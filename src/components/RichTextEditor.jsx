import { useEffect, useState, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { supabase } from '../lib/supabaseClient';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ── Toolbar SVG icons ──
const IconH1 = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4v16M20 4v16M4 12h12" /><path d="M20 8h-2a3 3 0 00-3 3v0a3 3 0 003 3h.5" /></svg>;
const IconH2 = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4v16M20 4v16M4 12h12" /></svg>;
const IconH3 = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4v16M4 12h12M16 8h-2a3 3 0 00-3 3v0a3 3 0 003 3h.5" /></svg>;
const IconBold = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 4h8a4 4 0 010 8H6zM6 12h9a4 4 0 010 8H6z" /></svg>;
const IconItalic = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" /></svg>;
const IconBulletList = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" /><circle cx="5" cy="6" r="1" fill="currentColor" /><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="5" cy="18" r="1" fill="currentColor" /></svg>;
const IconOrderedList = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="20" y2="6" /><line x1="10" y1="12" x2="20" y2="12" /><line x1="10" y1="18" x2="20" y2="18" /><text x="4" y="8" fontSize="8" fill="currentColor" stroke="none" fontFamily="sans-serif">1</text><text x="4" y="14" fontSize="8" fill="currentColor" stroke="none" fontFamily="sans-serif">2</text><text x="4" y="20" fontSize="8" fill="currentColor" stroke="none" fontFamily="sans-serif">3</text></svg>;
const IconBlockquote = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21c3 0 6-3 6-7 0-2-1-4-3-4 2-1 3-3 3-5 0-2-2-4-6-4" /><path d="M15 21c3 0 6-3 6-7 0-2-1-4-3-4 2-1 3-3 3-5 0-2-2-4-6-4" /></svg>;
const IconCode = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>;
const IconLink = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>;
const IconImage = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>;

// ── Toolbar Button ──
function ToolbarBtn({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      className={`rte-toolbar-btn${active ? ' is-active' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ value = '', onChange }) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const fileInputRef = useRef(null);
  const linkInputRef = useRef(null);
  const lastEmittedHtml = useRef(value);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastEmittedHtml.current = html;
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: 'ProseMirror',
        'data-placeholder': 'Write your post here…',
      },
    },
  });

  // Sync external value changes (e.g. editing a different post)
  useEffect(() => {
    if (editor && value !== lastEmittedHtml.current) {
      editor.commands.setContent(value || '');
      lastEmittedHtml.current = value;
    }
  }, [value, editor]);

  // Auto-focus link input when dialog opens
  useEffect(() => {
    if (showLinkInput && linkInputRef.current) {
      linkInputRef.current.focus();
    }
  }, [showLinkInput]);

  // ── Image upload ──
  const handleImageUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File too large. Max 5MB.');
      e.target.value = '';
      return;
    }

    if (!supabase) {
      setUploadError('Storage not configured.');
      e.target.value = '';
      return;
    }

    setUploadError(null);
    setUploading(true);

    const fileExt = file.name.split('.').pop();
    const filePath = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;

    const { data, error: uploadErr } = await supabase.storage
      .from('post-images')
      .upload(filePath, file, { upsert: false });

    if (uploadErr) {
      setUploadError(uploadErr.message);
      setUploading(false);
      e.target.value = '';
      return;
    }

    const { data: urlData } = supabase.storage
      .from('post-images')
      .getPublicUrl(data.path);

    editor?.chain().focus().setImage({ src: urlData.publicUrl, alt: file.name }).run();
    setUploading(false);
    e.target.value = '';
  }, [editor]);

  // ── Link handling ──
  const openLinkDialog = () => {
    if (!editor) return;

    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    const prevUrl = editor.getAttributes('link').href || '';
    setLinkUrl(prevUrl);
    setShowLinkInput(true);
  };

  const applyLink = (e) => {
    e.preventDefault();
    if (!editor) return;

    if (linkUrl.trim()) {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl.trim(), target: '_blank', rel: 'noopener noreferrer' })
        .run();
    }
    setShowLinkInput(false);
    setLinkUrl('');
  };

  const cancelLink = () => {
    setShowLinkInput(false);
    setLinkUrl('');
  };

  if (!editor) return null;

  return (
    <div className="rte">
      {/* ── Toolbar ── */}
      <div className="rte-toolbar">
        <div className="rte-toolbar-group">
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            H1
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            H2
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            H3
          </ToolbarBtn>
        </div>

        <div className="rte-toolbar-separator" />

        <div className="rte-toolbar-group">
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            disabled={!editor.can().toggleBold()}
            title="Bold"
          >
            <IconBold />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            disabled={!editor.can().toggleItalic()}
            title="Italic"
          >
            <IconItalic />
          </ToolbarBtn>
        </div>

        <div className="rte-toolbar-separator" />

        <div className="rte-toolbar-group">
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <IconBulletList />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="Ordered List"
          >
            <IconOrderedList />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            title="Blockquote"
          >
            <IconBlockquote />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive('codeBlock')}
            title="Code Block"
          >
            <IconCode />
          </ToolbarBtn>
        </div>

        <div className="rte-toolbar-separator" />

        <div className="rte-toolbar-group">
          <ToolbarBtn
            onClick={openLinkDialog}
            active={editor.isActive('link')}
            title={editor.isActive('link') ? 'Remove link' : 'Add link'}
          >
            <IconLink />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Upload image"
          >
            <IconImage />
          </ToolbarBtn>
        </div>
      </div>

      {/* ── Link dialog ── */}
      {showLinkInput && (
        <div className="rte-link-dialog">
          <input
            ref={linkInputRef}
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyLink(e);
              if (e.key === 'Escape') cancelLink();
            }}
          />
          <button type="button" className="rte-link-apply" onClick={applyLink}>
            Apply
          </button>
          <button type="button" onClick={cancelLink}>
            Cancel
          </button>
        </div>
      )}

      {/* ── Upload status ── */}
      {uploading && (
        <div className="rte-upload-status">
          <div className="rte-upload-spinner" />
          <span>Uploading image…</span>
        </div>
      )}
      {uploadError && (
        <p className="rte-upload-error">{uploadError}</p>
      )}

      {/* ── Hidden file input ── */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />

      {/* ── Editor content area ── */}
      <EditorContent editor={editor} className="rte-editor" />
    </div>
  );
}
