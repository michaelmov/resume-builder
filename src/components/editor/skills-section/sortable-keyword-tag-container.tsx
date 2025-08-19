import { Box } from '@chakra-ui/react';
import { FC } from 'react';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { SortableKeywordTag, KeywordItem } from './sortable-keyword-tag';

interface SortableKeywordTagContainerProps {
  keywords: KeywordItem[];
  onRemove: (index: number) => void;
}

export const SortableKeywordTagContainer: FC<SortableKeywordTagContainerProps> = ({ 
  keywords, 
  onRemove 
}) => {
  return (
    <SortableContext items={keywords.map(k => k.id)} strategy={rectSortingStrategy}>
      <Box 
        display="flex" 
        flexWrap="wrap" 
        gap={2}
        mb={2}
      >
        {keywords.map((keyword, index) => {
          return (
            <SortableKeywordTag
              key={keyword.id}
              value={keyword.value}
              id={keyword.id}
              onRemove={onRemove}
              idx={index}
            />
          );
        })}
      </Box>
    </SortableContext>
  );
};

export type { SortableKeywordTagContainerProps };
