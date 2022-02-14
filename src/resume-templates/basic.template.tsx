import {
  Box,
  Flex,
  forwardRef,
  Heading,
  HeadingProps,
  Text,
  TypographyProps,
} from '@chakra-ui/react';
import { Global } from '@emotion/react';
import { FC, useMemo } from 'react';
import { Resume } from '../models/resume.model';

const Fonts = () => (
  <Global
    styles={`
    @import url('https://fonts.googleapis.com/css2?family=Abril+Fatface&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400&display=swap');
    `}
  />
);

const styleConfig = {
  headingFont: 'Abril Fatface',
  bodyFont: 'Poppins',
};

interface BasicHeadingProps extends HeadingProps {
  decorationColor?: string;
}
const BasicHeading = forwardRef<BasicHeadingProps, 'h1'>((props, ref) => {
  const _fontSize = useMemo<TypographyProps['fontSize']>(() => {
    switch (props.as) {
      case 'h1':
        return '4xl';
      case 'h2':
        return 'xl';
      default:
        return 'initial';
    }
  }, [props.as]);

  return (
    <Heading
      {...props}
      ref={ref}
      fontSize={_fontSize || props.fontSize}
      fontFamily={styleConfig.headingFont}
      width="auto"
      letterSpacing={props.letterSpacing || 2}
      zIndex={1}
    >
      <Text
        as="span"
        position="relative"
        zIndex={1}
        display={props.as === 'h2' ? 'inline' : 'block'}
        _after={{
          position: 'absolute',
          content: '" "',
          bgColor: props.decorationColor || 'blue.100',
          height: props.as === 'h2' ? '10px' : '20px',
          width: '100%',
          left: 0,
          bottom: 0,
          zIndex: -1,
        }}
      >
        {props.children}
      </Text>
    </Heading>
  );
});

interface TemplateProps {
  resume: Resume;
}
export const BasicTemplate: FC<TemplateProps> = ({ resume }) => {
  return (
    <Box fontFamily={styleConfig.bodyFont} color="gray.700">
      <Fonts />
      <BasicHeading as="h1" mb={1}>
        {resume.basics.name}
      </BasicHeading>
      <Text textTransform="uppercase" color="gray.500" mb={4}>
        {resume.basics.label}
      </Text>
      <Flex
        justifyContent="space-between"
        fontSize="sm"
        color="gray.500"
        mb={6}
      >
        <Text textAlign="left">{resume.basics.location?.city}</Text>
        <Text>{resume.basics.phone}</Text>
        <Text textAlign="center">{resume.basics.email}</Text>
        <Text>{resume.basics.url}</Text>
      </Flex>
      <Text>{resume.basics.summary}</Text>
      <BasicHeading as="h2" mt={8}>
        Work History
      </BasicHeading>
    </Box>
  );
};
