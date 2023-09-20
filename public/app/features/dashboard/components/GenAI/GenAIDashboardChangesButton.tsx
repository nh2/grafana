import React, { useMemo } from 'react';

import { DashboardModel } from '../../state';
import { Diffs, jsonDiff } from '../VersionHistory/utils';

import { GenAIButton } from './GenAIButton';
import { getDashboardChanges, Message, Role } from './utils';

interface GenAIDashboardChangesButtonProps {
  dashboard: DashboardModel;
  onGenerate: (title: string, isDone: boolean) => void;
}

const CHANGES_GENERATION_STANDARD_PROMPT = [
  'You are an expert in Grafana Dashboards',
  'Your goal is to write a description of the changes for a dashboard',
  'When referring to panel changes, use the panel title',
  'When using panel title, wrap it with double quotes',
  'Group all the positioning changes together under the title "Panel position changes"',
  'Group changes when all panels are affected',
  'Do not mention line number',
  'Refer to templating elements as variables',
  'Ignore and never mention changes about plugin version',
  'Try to make it as short as possible.',
].join('. ');

export const GenAIDashboardChangesButton = ({ dashboard, onGenerate }: GenAIDashboardChangesButtonProps) => {
  const messages = useMemo(() => getMessages(dashboard), [dashboard]);

  return <GenAIButton messages={messages} onReply={onGenerate} loadingText={'Generating changes summary'} temperature={0} />;
};

function getMessages(dashboard: DashboardModel): Message[] {
  const { userChanges, migrationChanges } = getDashboardChanges(dashboard);

  return [
    {
      content: CHANGES_GENERATION_STANDARD_PROMPT,
      role: Role.system,
    },
    {
      content: `This is the list of panel names, when referring to a panel, please use the title: ${JSON.stringify(
        dashboard.panels.map((panel) => panel.title)
      )}`,
      role: Role.system,
    },
    {
      content: `Group the following diff under "User changes" as a bullet list: ${JSON.stringify(userChanges)}`,
      role: Role.system,
    },
    {
      content: `Group the following diff under "Migration changes" as a bullet list: ${JSON.stringify(
        migrationChanges
      )}`,
      role: Role.system,
    },
  ];
}
