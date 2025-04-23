'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { HashtagHighlight } from './Tiptap';
// @ts-ignore
import styles from './render.module.scss';

const Render = ({ data }: { data?: string }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure(),
      HashtagHighlight.configure({
        // onHashtagClick: handleHashtagClick,
      }),
    ],
    content: data,
    editable: false,
  });

  return (
    <div className={styles.tiptapRenderContainer}>
      <EditorContent editor={editor} />
    </div>
  );
};

export default Render;
