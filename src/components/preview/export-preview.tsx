import { FC } from 'react';
import { useResume } from '../../hooks/useResume';
import { BasicTemplate } from '../../resume-templates/basic.template';
import { Paper } from './paper';

export const ExportPreview: FC = () => {
  const { resume } = useResume();
  return (
    <Paper pagemargin={0.5}>
      <BasicTemplate resume={resume} />
    </Paper>
  );
};
