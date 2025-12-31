import { useEffect, useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
} from "lucide-react";

interface BlogEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const toolbarButtonBase =
  "inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-200 text-gray-700 transition-all";
const toolbarButtonActive =
  "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30";
const toolbarButtonHover = "hover:bg-[#0A0A0A]/5";

export default function BlogEditor({ value, onChange }: BlogEditorProps) {
  const [isPreview, setIsPreview] = useState(false);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: false,
      }),
      Heading.configure({ levels: [1, 2, 3] }),
      Image.configure({ inline: false }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({
        placeholder: "Start writing your post...",
      }),
    ],
    []
  );

  const editor = useEditor({
    extensions,
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value, false);
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="border-2 border-gray-200 rounded-lg min-h-[400px] flex items-center justify-center text-sm text-gray-500">
        Loading editor...
      </div>
    );
  }

  const addLink = () => {
    const url = window.prompt("Enter link URL");
    if (!url) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt("Enter image URL");
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-200 px-3 py-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`${toolbarButtonBase} ${editor.isActive("bold") ? toolbarButtonActive : ""} ${toolbarButtonHover}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          className={`${toolbarButtonBase} ${editor.isActive("italic") ? toolbarButtonActive : ""} ${toolbarButtonHover}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <button
          type="button"
          className={`px-3 py-2 rounded-md text-xs font-semibold border border-gray-200 transition-all ${editor.isActive("heading", { level: 1 }) ? toolbarButtonActive : "text-gray-700"} ${toolbarButtonHover}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          className={`px-3 py-2 rounded-md text-xs font-semibold border border-gray-200 transition-all ${editor.isActive("heading", { level: 2 }) ? toolbarButtonActive : "text-gray-700"} ${toolbarButtonHover}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          className={`px-3 py-2 rounded-md text-xs font-semibold border border-gray-200 transition-all ${editor.isActive("heading", { level: 3 }) ? toolbarButtonActive : "text-gray-700"} ${toolbarButtonHover}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3"
        >
          H3
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <button
          type="button"
          className={`${toolbarButtonBase} ${editor.isActive("bulletList") ? toolbarButtonActive : ""} ${toolbarButtonHover}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          className={`${toolbarButtonBase} ${editor.isActive("orderedList") ? toolbarButtonActive : ""} ${toolbarButtonHover}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Ordered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <button
          type="button"
          className={`${toolbarButtonBase} ${editor.isActive("link") ? toolbarButtonActive : ""} ${toolbarButtonHover}`}
          onClick={addLink}
          title="Link"
        >
          <Link2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          className={`${toolbarButtonBase} ${toolbarButtonHover}`}
          onClick={addImage}
          title="Image"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Preview</span>
          <button
            type="button"
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isPreview ? "bg-[#D4AF37]" : "bg-gray-200"
            }`}
            onClick={() => setIsPreview((current) => !current)}
            aria-pressed={isPreview}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                isPreview ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="min-h-[400px]">
        {isPreview ? (
          <div
            className="prose prose-lg max-w-none p-6"
            dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
          />
        ) : (
          <EditorContent editor={editor} className="p-6 min-h-[400px] focus:outline-none" />
        )}
      </div>
    </div>
  );
}

const editorStyles = `
  .ProseMirror {
    min-height: 400px;
    outline: none;
  }
  .ProseMirror h1 {
    font-size: 2.25rem;
    font-weight: 700;
    margin-top: 2rem;
    margin-bottom: 1rem;
    line-height: 1.2;
    color: #0A0A0A;
  }
  .ProseMirror h2 {
    font-size: 1.875rem;
    font-weight: 700;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    line-height: 1.3;
    color: #0A0A0A;
  }
  .ProseMirror h3 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-top: 1.25rem;
    margin-bottom: 0.5rem;
    line-height: 1.4;
    color: #0A0A0A;
  }
  .ProseMirror p {
    margin-bottom: 1rem;
    line-height: 1.75;
  }
  .ProseMirror ul,
  .ProseMirror ol {
    padding-left: 1.5rem;
    margin-bottom: 1rem;
  }
  .ProseMirror ul {
    list-style-type: disc;
  }
  .ProseMirror ol {
    list-style-type: decimal;
  }
`;

if (typeof document !== "undefined" && !document.getElementById("blog-editor-styles")) {
  const style = document.createElement("style");
  style.id = "blog-editor-styles";
  style.textContent = editorStyles;
  document.head.appendChild(style);
}
