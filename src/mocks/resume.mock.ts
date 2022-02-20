import { Resume } from '../models/resume.model';

export const resumeMock: Resume = {
  basics: {
    name: 'John Doe',
    label: 'Senior Software Engineer',
    image: '',
    email: 'john@gmail.com',
    phone: '(912) 555-4321',
    url: 'https://johndoe.com',
    summary:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ',
    location: {
      address: '2712 Broadway St',
      postalCode: 'CA 94115',
      city: 'San Francisco',
      countryCode: 'US',
      region: 'California',
    },
    profiles: [
      {
        network: 'Twitter',
        username: 'john',
        url: 'https://twitter.com/john',
      },
    ],
  },
  work: [
    {
      name: 'Company',
      position: 'President',
      url: 'https://company.com',
      startDate: new Date('2013-01-01'),
      endDate: new Date('2014-01-01'),
      summary: 'Description…',
      highlights: ['Started the company'],
    },
  ],
  volunteer: [
    {
      organization: 'Organization',
      position: 'Volunteer',
      url: 'https://organization.com/',
      startDate: new Date('2013-01-01'),
      endDate: new Date('2014-01-01'),
      summary: 'Description…',
      highlights: ["Awarded 'Volunteer of the Month'"],
    },
  ],
  education: [
    {
      institution: 'University',
      url: 'https://institution.com/',
      area: 'Software Development',
      studyType: 'Bachelor',
      startDate: new Date('2013-01-01'),
      endDate: new Date('2014-01-01'),
      score: '4.0',
      courses: ['DB1101 - Basic SQL'],
    },
  ],
  awards: [
    {
      title: 'Award',
      date: new Date('2014-11-01'),
      awarder: 'Company',
      summary: 'There is no spoon.',
    },
  ],
  certificates: [
    {
      name: 'Certificate',
      date: new Date('2021-11-07'),
      issuer: 'Company',
      url: 'https://certificate.com',
    },
  ],
  publications: [
    {
      name: 'Publication',
      publisher: 'Company',
      releaseDate: new Date('2014-10-01'),
      url: 'https://publication.com',
      summary: 'Description…',
    },
  ],
  skills: [
    {
      name: 'Web Development',
      level: 'Master',
      keywords: [{ value: 'HTML' }, { value: 'CSS' }, { value: 'JavaScript' }],
    },
  ],
  languages: [
    {
      language: 'English',
      fluency: 'Native speaker',
    },
  ],
  interests: [
    {
      name: 'Wildlife',
      keywords: ['Ferrets', 'Unicorns'],
    },
  ],
  references: [
    {
      name: 'Jane Doe',
      reference: 'Reference…',
    },
  ],
  projects: [
    {
      name: 'Project',
      description: 'Description…',
      highlights: ['Won award at AIHacks 2016'],
      keywords: ['HTML'],
      startDate: new Date('2019-01-01'),
      endDate: new Date('2021-01-01'),
      url: 'https://project.com/',
      roles: ['Team Lead'],
      entity: 'Entity',
      type: 'application',
    },
  ],
};
