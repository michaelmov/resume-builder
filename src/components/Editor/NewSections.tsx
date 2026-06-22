import { FC } from 'react';

import {
  Award,
  Certificate,
  Language,
  Publication,
  Reference,
  SectionTypes,
  Work,
} from '../../types/resume.model';

import { GenericListSection } from './GenericListSection';

/**
 * Thin per-type wrappers around {@link GenericListSection}. Each declares its
 * field layout and a blank-entry factory; the generic component handles the
 * form, staging, reordering, removal, and "Save All / Discard" wiring.
 */

interface SectionProps<T> {
  value: T[];
  onUpdate: (sectionType: SectionTypes, section: T[]) => void;
}

export const VolunteerSection: FC<SectionProps<Work>> = ({
  value,
  onUpdate,
}) => (
  <GenericListSection<Work>
    sectionType={SectionTypes.Volunteer}
    value={value}
    onUpdate={onUpdate}
    titleField="organization"
    subtitleField="position"
    addLabel="Add Volunteer Role"
    emptyEntry={() => ({
      organization: '',
      position: '',
      url: '',
      startDate: '',
      endDate: '',
      isPresent: false,
      summary: '',
      highlights: [],
    })}
    fields={[
      { name: 'organization', label: 'Organization' },
      { name: 'position', label: 'Role' },
      { name: 'startDate', label: 'Start date', type: 'date' },
      { name: 'endDate', label: 'End date', type: 'date' },
      {
        name: 'url',
        label: 'URL',
        type: 'url',
        placeholder: 'https://example.org',
        colSpan: 2,
      },
      { name: 'summary', label: 'Summary', type: 'textarea', colSpan: 2 },
    ]}
    bullet={{
      name: 'highlights',
      label: 'Highlights',
      addLabel: 'Add Highlight',
      itemShape: 'value',
    }}
  />
);

export const AwardsSection: FC<SectionProps<Award>> = ({ value, onUpdate }) => (
  <GenericListSection<Award>
    sectionType={SectionTypes.Awards}
    value={value}
    onUpdate={onUpdate}
    titleField="title"
    subtitleField="awarder"
    addLabel="Add Award"
    emptyEntry={() => ({ title: '', date: '', awarder: '', summary: '' })}
    fields={[
      { name: 'title', label: 'Title' },
      { name: 'awarder', label: 'Awarder' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'summary', label: 'Summary', type: 'textarea', colSpan: 2 },
    ]}
  />
);

export const CertificatesSection: FC<SectionProps<Certificate>> = ({
  value,
  onUpdate,
}) => (
  <GenericListSection<Certificate>
    sectionType={SectionTypes.Certificates}
    value={value}
    onUpdate={onUpdate}
    titleField="name"
    subtitleField="issuer"
    addLabel="Add Certificate"
    emptyEntry={() => ({ name: '', date: '', issuer: '', url: '' })}
    fields={[
      { name: 'name', label: 'Name' },
      { name: 'issuer', label: 'Issuer' },
      { name: 'date', label: 'Date', type: 'date' },
      {
        name: 'url',
        label: 'URL',
        type: 'url',
        placeholder: 'https://example.com',
        colSpan: 2,
      },
    ]}
  />
);

export const PublicationsSection: FC<SectionProps<Publication>> = ({
  value,
  onUpdate,
}) => (
  <GenericListSection<Publication>
    sectionType={SectionTypes.Publications}
    value={value}
    onUpdate={onUpdate}
    titleField="name"
    subtitleField="publisher"
    addLabel="Add Publication"
    emptyEntry={() => ({
      name: '',
      publisher: '',
      releaseDate: '',
      url: '',
      summary: '',
    })}
    fields={[
      { name: 'name', label: 'Name' },
      { name: 'publisher', label: 'Publisher' },
      { name: 'releaseDate', label: 'Release date', type: 'date' },
      {
        name: 'url',
        label: 'URL',
        type: 'url',
        placeholder: 'https://example.com',
        colSpan: 2,
      },
      { name: 'summary', label: 'Summary', type: 'textarea', colSpan: 2 },
    ]}
  />
);

export const LanguagesSection: FC<SectionProps<Language>> = ({
  value,
  onUpdate,
}) => (
  <GenericListSection<Language>
    sectionType={SectionTypes.Languages}
    value={value}
    onUpdate={onUpdate}
    titleField="language"
    subtitleField="fluency"
    addLabel="Add Language"
    emptyEntry={() => ({ language: '', fluency: '' })}
    fields={[
      { name: 'language', label: 'Language' },
      {
        name: 'fluency',
        label: 'Fluency',
        placeholder: 'e.g. Native, Fluent, Conversational',
      },
    ]}
  />
);

export const ReferencesSection: FC<SectionProps<Reference>> = ({
  value,
  onUpdate,
}) => (
  <GenericListSection<Reference>
    sectionType={SectionTypes.References}
    value={value}
    onUpdate={onUpdate}
    titleField="name"
    addLabel="Add Reference"
    emptyEntry={() => ({ name: '', reference: '' })}
    fields={[
      { name: 'name', label: 'Name' },
      { name: 'reference', label: 'Reference', type: 'textarea', colSpan: 2 },
    ]}
  />
);
