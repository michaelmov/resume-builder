import { Resume, SectionTypes } from '../types/resume.model';

/**
 * Seed resume for a brand-new visitor (no `localStorage` yet) — a sampler built
 * from Linus Torvalds' public career, kept to the four default sections so the
 * first preview looks like a finished, realistic resume rather than lorem ipsum.
 */
export const resumeMock: Resume = {
  basics: {
    name: 'Linus Torvalds',
    label: 'Creator & Lead Maintainer of the Linux Kernel',
    image: '',
    email: 'torvalds@linux-foundation.org',
    phone: '',
    url: 'https://github.com/torvalds',
    summary:
      'Systems programmer who wrote the Linux kernel in 1991 and has led its development ever since, coordinating thousands of contributors across a release every nine to ten weeks. Also the author of Git, now the default version control system of the software industry. Deep expertise in operating system internals, portability, concurrency, and the review workflows that keep very large open source projects moving.',
    location: {
      address: '',
      postalCode: '',
      city: 'Portland',
      countryCode: 'US',
      region: 'Oregon',
    },
    profiles: [
      {
        network: 'GitHub',
        username: 'torvalds',
        url: 'https://github.com/torvalds',
      },
    ],
  },
  work: [
    {
      name: 'Linux Foundation',
      position: 'Fellow',
      url: 'https://linuxfoundation.org',
      startDate: new Date('2007-01-01'),
      endDate: '',
      isPresent: true,
      summary:
        'Work full time on the Linux kernel, funded by the foundation so development stays vendor neutral.',
      highlights: [
        {
          value:
            'Maintain the mainline kernel tree and cut a release roughly every nine to ten weeks.',
        },
        {
          value:
            'Review and merge pull requests from hundreds of subsystem maintainers each cycle.',
        },
        {
          value:
            'Set the technical direction and stability rules for a codebase used from phones to supercomputers.',
        },
      ],
    },
    {
      name: 'Open Source Development Labs',
      position: 'Fellow',
      url: '',
      startDate: new Date('2003-06-01'),
      endDate: new Date('2007-01-01'),
      isPresent: false,
      summary:
        'First full-time position dedicated to kernel development, at the industry consortium that later merged into the Linux Foundation.',
      highlights: [
        {
          value:
            'Led the 2.6 kernel series through its move to a continuous, time-based release model.',
        },
        {
          value:
            'Built the distributed patch workflow that let the contributor base scale past what a single tree could handle.',
        },
      ],
    },
    {
      name: 'Transmeta Corporation',
      position: 'Software Engineer',
      url: '',
      startDate: new Date('1997-02-01'),
      endDate: new Date('2003-06-01'),
      isPresent: false,
      summary:
        'Worked on the Crusoe low-power x86 processor family while continuing to maintain Linux on the side.',
      highlights: [
        {
          value:
            'Contributed to the code-morphing software that translated x86 instructions for the Crusoe VLIW core.',
        },
        {
          value:
            'Shipped kernel releases 2.2 and 2.4 during this period, including SMP scalability and architecture ports.',
        },
      ],
    },
  ],
  volunteer: [],
  education: [
    {
      institution: 'University of Helsinki',
      url: 'https://www.helsinki.fi',
      area: 'Computer Science',
      studyType: 'Master of Science',
      startDate: new Date('1988-09-01'),
      endDate: new Date('1996-12-01'),
      score: '',
      courses: [
        'Thesis: Linux — A Portable Operating System',
        'Operating Systems',
        'Compilers',
      ],
    },
  ],
  awards: [],
  certificates: [],
  publications: [],
  skills: [
    {
      name: 'Systems Programming',
      level: 'Expert',
      keywords: [
        { value: 'C' },
        { value: 'x86 Assembly' },
        { value: 'Kernel Internals' },
        { value: 'Memory Management' },
        { value: 'Concurrency & SMP' },
        { value: 'Device Drivers' },
      ],
    },
    {
      name: 'Tooling & Workflow',
      level: 'Expert',
      keywords: [
        { value: 'Git' },
        { value: 'Distributed Version Control' },
        { value: 'Patch Review' },
        { value: 'Release Engineering' },
      ],
    },
    {
      name: 'Open Source Leadership',
      level: 'Advanced',
      keywords: [
        { value: 'Maintainer Workflows' },
        { value: 'Technical Direction' },
        { value: 'Mailing List Collaboration' },
      ],
    },
  ],
  languages: [],
  interests: [],
  references: [],
  projects: [
    {
      name: 'Linux Kernel',
      description:
        'A free, POSIX-compatible operating system kernel started as a personal project in 1991 and now the most widely deployed kernel in the world.',
      highlights: [
        'Grew from a 10,000-line hobby project to tens of millions of lines contributed by thousands of developers.',
        'Runs the majority of web servers, all of the top 500 supercomputers, and every Android device.',
        'Released under the GPLv2, which kept the ecosystem open as commercial vendors adopted it.',
      ],
      keywords: ['C', 'Operating Systems', 'Open Source'],
      startDate: new Date('1991-09-01'),
      endDate: '',
      url: 'https://kernel.org',
      roles: ['Creator', 'Lead Maintainer'],
      entity: 'Linux Foundation',
      type: 'application',
    },
    {
      name: 'Git',
      description:
        'A distributed version control system written in two weeks to replace the kernel project’s proprietary tooling.',
      highlights: [
        'Designed around content-addressable storage and cheap branching for very large, distributed teams.',
        'Handed maintainership to Junio Hamano within months; now the industry standard for source control.',
      ],
      keywords: ['C', 'Distributed Systems', 'Version Control'],
      startDate: new Date('2005-04-01'),
      endDate: new Date('2005-07-01'),
      url: 'https://git-scm.com',
      roles: ['Creator'],
      entity: 'Open Source',
      type: 'application',
    },
    {
      name: 'Subsurface',
      description:
        'Cross-platform dive logging and planning software, created out of frustration with the existing options.',
      highlights: [
        'Built the initial application and imported dive data from a wide range of consumer dive computers.',
        'Maintained the project for its first years before handing it off to the community.',
      ],
      keywords: ['C', 'Qt', 'Open Source'],
      startDate: new Date('2011-09-01'),
      endDate: new Date('2018-01-01'),
      url: 'https://subsurface-divelog.org',
      roles: ['Creator', 'Maintainer'],
      entity: 'Open Source',
      type: 'application',
    },
  ],
  sectionOrder: [
    SectionTypes.Work,
    SectionTypes.Projects,
    SectionTypes.Skills,
    SectionTypes.Education,
  ],
};
