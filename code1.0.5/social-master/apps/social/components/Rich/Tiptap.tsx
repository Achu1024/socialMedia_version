'use client';

import { Extension } from '@tiptap/core';
import Placeholder from '@tiptap/extension-placeholder';
import { Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { useImperativeHandle } from 'react';
// @ts-ignore
import styles from './tiptap.module.scss';

// 改进标签高亮扩展
export const HashtagHighlight = Extension.create({
  name: 'hashtagHighlight',

  addOptions() {
    return {
      onHashtagClick: (hashtag: string) => {},
    };
  },

  addProseMirrorPlugins() {
    const { onHashtagClick } = this.options;

    return [
      new Plugin({
        key: new PluginKey('hashtagHighlight'),

        // 确保插件每次更新都会重新应用高亮
        state: {
          init() {
            return {};
          },
          apply(tr) {
            return {};
          },
        },

        props: {
          // 处理点击事件
          handleClick(view, pos, event) {
            const dom = event.target as HTMLElement;
            if (dom.classList.contains('hashtag-highlight')) {
              const hashtag = dom.getAttribute('data-hashtag');
              if (hashtag) {
                onHashtagClick(hashtag);
                return true;
              }
            }
            return false;
          },

          decorations(state) {
            const { doc } = state;
            const decorations: Decoration[] = [];
            const hashtagSet = new Set<string>(); // 用于跟踪已处理的标签

            doc.descendants((node, pos) => {
              if (!node.isText) return;

              const text = node.text || '';

              // 修改正则表达式，更准确地匹配标签
              // 支持中文、英文、数字的标签
              const regex =
                /#([\w\d\u4e00-\u9fa5]|[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f])+/g;
              let match;

              while ((match = regex.exec(text)) !== null) {
                const hashtag = match[0];
                const start = pos + match.index;
                const end = start + hashtag.length;

                // 确保标签唯一性 (位置+文本)
                const key = `${start}-${end}-${hashtag}`;
                if (!hashtagSet.has(key)) {
                  hashtagSet.add(key);

                  // 添加tooltip属性
                  const decoration = Decoration.inline(start, end, {
                    class: 'hashtag-highlight',
                    'data-hashtag': hashtag.substring(1), // 移除 # 符号
                    'data-tooltip': hashtag, // 用于tooltip显示完整内容
                    'title': hashtag, // 为浏览器原生tooltip添加内容
                  });

                  decorations.push(decoration);
                }
              }
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});

// 定义ref接口
export interface TiptapRef {
  editor: Editor | null;
}

const Tiptap = ({
  onContentUpdate,
  ref,
}: {
  onContentUpdate?: (content: string) => void;
  ref: React.RefObject<TiptapRef | null>;
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure(),
      Placeholder.configure({
        placeholder: '有什么新鲜事想分享给大家?',
      }),
      HashtagHighlight.configure({
        // onHashtagClick: handleHashtagClick,
      }),
    ],
    content: '',
    editable: true,

    onUpdate: ({ editor }) => {
      // const content = editor.getText();
      const dom = editor.getHTML();
      if (onContentUpdate) {
        onContentUpdate(dom);
      }
      // 强制更新视图以确保高亮正确应用
      editor.view.updateState(editor.view.state);
    },
  });

  // 暴露editor实例给父组件
  useImperativeHandle(
    ref,
    () => ({
      editor,
    }),
    [editor]
  );

  return (
    <div className={styles.tiptapEditorContainer}>
      <EditorContent editor={editor} />
    </div>
  );
};

// 设置组件显示名称
Tiptap.displayName = 'Tiptap';

export default Tiptap;
