import {
  Box,
  Flex,
  Heading,
  HeadingProps,
  Link,
  List,
  Text,
} from '@chakra-ui/react';
import { forwardRef } from 'react';
import { Global } from '@emotion/react';
import { FC, useMemo } from 'react';
import { Resume } from '../types/resume.model';
import { HiArrowSmRight } from 'react-icons/hi';
import { formatDate } from '../utils/date-utilities';

const Fonts = () => (
  <Global
    styles={`
    @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@500&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400&display=swap');
    `}
  />
);

const styleConfig = {
  headingFont: 'Roboto Mono',
  bodyFont: 'Poppins',
};

interface BasicHeadingProps extends HeadingProps {
  decorationColor?: string;
}
const BasicHeading = forwardRef<HTMLHeadingElement, BasicHeadingProps>((props, ref) => {
  const _fontSize = useMemo(() => {
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
        fontFamily={styleConfig.headingFont}
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
    <Box fontFamily={styleConfig.bodyFont} color="gray.700" fontSize="sm">
      <Fonts />
      <BasicHeading as="h1" mb={1}>
        {resume.basics.name}
      </BasicHeading>
      <Text textTransform="uppercase" color="blackAlpha.600" mb={3}>
        {resume.basics.label}
      </Text>
      <Flex
        justifyContent="space-between"
        fontSize="sm"
        color="blackAlpha.600"
        mb={6}
      >
        <Text textAlign="left">{resume.basics.location?.city}</Text>
        <Text>{resume.basics.phone}</Text>
        <Text textAlign="center">{resume.basics.email}</Text>
        <Link href={`//${resume.basics.url}`}>{resume.basics.url}</Link>
      </Flex>
      <Text>{resume.basics.summary}</Text>
      <BasicHeading as="h2" mt={9} mb={3}>
        Skills
      </BasicHeading>
      <Box>
        {resume.skills.map((skill, idx) => {
          return (
            <Box key={idx} style={{ breakInside: 'avoid' }}>
              <Text
                as="h3"
                fontWeight="bold"
                mb={1}
                fontFamily={styleConfig.headingFont}
                color="blackAlpha.700"
              >
                {skill.name}
              </Text>
              <Box mb={4} display="flex" flexWrap="wrap">
                {skill.keywords.map((keyword, idx) => (
                  <Text
                    key={`${idx}${keyword.value}`}
                    fontSize="xs"
                    py={0.5}
                    px={1}
                    as="span"
                    mr={2}
                    mt={2}
                    borderWidth={1}
                    borderColor="blue.200"
                    borderRadius={4}
                    color="blackAlpha.700"
                  >
                    {keyword.value}
                  </Text>
                ))}
              </Box>
            </Box>
          );
        })}
      </Box>
      <BasicHeading as="h2" mt={8} mb={3}>
        Work Experience
      </BasicHeading>
      {resume.work.map((job, idx) => {
        return (
          <Box
            mb={6}
            key={`${idx}${job.name}`}
            style={{ breakInside: 'avoid' }}
          >
            <Flex
              justifyContent="space-between"
              color="blackAlpha.600"
              mb={1}
              fontFamily={styleConfig.headingFont}
            >
              <Text
                as="h3"
                textAlign="left"
                fontWeight="bold"
                color="blackAlpha.700"
                width="100%"
              >
                {job.name}
              </Text>
              <Text textAlign="center" fontSize="sm" width="100%">
                {job.position}
              </Text>
              <Text textAlign="right" fontSize="sm" width="100%">
                {formatDate(job.startDate)} - {formatDate(job.endDate)}
              </Text>
            </Flex>
            <Text as="p" mb={2}>
              {job.summary}
            </Text>
            <List.Root>
              {job.highlights.map((highlight, idx) => (
                <List.Item
                  key={`${idx}${highlight.value}`}
                  display="flex"
                  alignItems="center"
                  mb={1}
                >
                  <List.Indicator asChild color="blue.200">
                    <HiArrowSmRight />
                  </List.Indicator>
                  {highlight.value}
                </List.Item>
              ))}
            </List.Root>
          </Box>
        );
      })}
      <BasicHeading as="h2" mt={8} mb={3}>
        Education
      </BasicHeading>
      {resume.education.map((study, idx) => {
        return (
          <Flex
            key={`${idx}${study}`}
            justifyContent="space-between"
            color="blackAlpha.600"
            mb={1}
            fontFamily={styleConfig.headingFont}
            style={{ breakInside: 'avoid' }}
          >
            <Text
              as="h3"
              textAlign="left"
              fontWeight="bold"
              color="blackAlpha.700"
              width="100%"
            >
              {study.institution}
            </Text>
            <Text textAlign="center" fontSize="sm" width="100%">
              {study.area}
            </Text>
            <Text textAlign="right" fontSize="sm" width="100%">
              {formatDate(study.endDate)}
            </Text>
          </Flex>
        );
      })}
    </Box>
  );
};
