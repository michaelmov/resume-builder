import {
  Box,
  Button,
  Icon,
  Grid,
  GridItem,
  NumberInput,
} from '@chakra-ui/react';
import { FC, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { HiDownload } from 'react-icons/hi';
import { BasicTemplate } from '../../resume-templates/basic.template';
import { useResume } from '../../hooks/useResume';
import { Paper } from './paper';
import { PDFViewer } from '@react-pdf/renderer';
import DuoTemplate from '../../resume-templates/duo';

export const Preview: FC = () => {
  const { resume } = useResume();

  const template = <DuoTemplate resume={resume} />;

  return (
    <>
      <PDFViewer width="100%" height="100%" showToolbar={false}>
        {template}
      </PDFViewer>
    </>
  );
};
