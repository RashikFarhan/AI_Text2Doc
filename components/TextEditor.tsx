"use client";

interface TextEditorProps {
  text: string;
  setText: (val: string) => void;
}

export default function TextEditor({ text, setText }: TextEditorProps) {
  return (
    <>
      <div className="panel-header">
        <span className="panel-dot" />
        <span className="panel-title">Editor</span>
      </div>
      <textarea
        className="editor-textarea"
        placeholder="Paste your AI-generated text here...

Supports Markdown:
  # Heading 1
  **bold**, *italic*, `code`
  - lists, tables

Supports LaTeX:
  Inline: $E = mc^2$
  Block: $$\int_0^\infty f(x)\,dx$$"
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
      />
    </>
  );
}
