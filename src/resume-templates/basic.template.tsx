import {
  Box,
  Flex,
  forwardRef,
  Heading,
  HeadingProps,
  Link,
  List,
  ListIcon,
  ListItem,
  Text,
  TypographyProps,
} from '@chakra-ui/react';
import { Global } from '@emotion/react';
import { FC, useMemo } from 'react';
import { Resume } from '../models/resume.model';
import { HiArrowSmRight } from 'react-icons/hi';

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

const formatDate = (date: Date | string) => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: undefined,
  };
  let formattedDate = new Date(date).toLocaleDateString('en-US', options);

  if (formattedDate === 'Invalid Date') {
    return date;
  }

  return formattedDate;
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
                    key={`${idx}${keyword}`}
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
                    {keyword}
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
          <Box mb={6} key={`${idx}${job}`} style={{ breakInside: 'avoid' }}>
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
            <List>
              {job.highlights.map((highlight, idx) => (
                <ListItem
                  key={`${idx}${highlight}`}
                  display="flex"
                  alignItems="center"
                  mb={1}
                >
                  <ListIcon as={HiArrowSmRight} color="blue.200" />
                  {highlight}
                </ListItem>
              ))}
            </List>
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
