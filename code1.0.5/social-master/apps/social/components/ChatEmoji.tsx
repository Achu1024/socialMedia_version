import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import styles from './chat.module.css';

export default function ChatEmoji({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: (e: any) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent asChild>
        <section className={`h-[50dvh] w-full  ${styles.emojiPicker} `}>
          <Picker
            data={data}
            onEmojiSelect={(e: any) => onClick(e)}
            theme='light'
            locale='zh'
            custom={[
              {
                styles: {
                  section: {
                    display: 'flex !important',
                    'flex-direction': 'column !important',
                    'z-index': '100000',
                    width: '100% !important',
                  },
                },
              },
            ]}
            previewPosition='none'
            skinTonePosition='none'
            navPosition='bottom'
            perLine={6}
          />
        </section>
      </PopoverContent>
    </Popover>
  );
}
