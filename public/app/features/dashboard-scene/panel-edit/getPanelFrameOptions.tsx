import { SelectableValue } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { config } from '@grafana/runtime';
import { SceneObjectState, SceneTimeRangeLike, VizPanel } from '@grafana/scenes';
import { DataLinksInlineEditor, Input, TextArea, Switch, RadioButtonGroup, Select } from '@grafana/ui';
import { GenAIPanelDescriptionButton } from 'app/features/dashboard/components/GenAI/GenAIPanelDescriptionButton';
import { GenAIPanelTitleButton } from 'app/features/dashboard/components/GenAI/GenAIPanelTitleButton';
import { OptionsPaneCategoryDescriptor } from 'app/features/dashboard/components/PanelEditor/OptionsPaneCategoryDescriptor';
import { OptionsPaneItemDescriptor } from 'app/features/dashboard/components/PanelEditor/OptionsPaneItemDescriptor';
import { RepeatRowSelect2 } from 'app/features/dashboard/components/RepeatRowSelect/RepeatRowSelect';
import { getPanelLinksVariableSuggestions } from 'app/features/panel/panellinks/link_srv';

import { DashboardGridItem } from '../scene/DashboardGridItem';
import { VizPanelLinks } from '../scene/PanelLinks';
import { PanelTimeRange } from '../scene/PanelTimeRange';
import { vizPanelToPanel, transformSceneToSaveModel } from '../serialization/transformSceneToSaveModel';
import { dashboardSceneGraph } from '../utils/dashboardSceneGraph';
import { getDashboardSceneFor } from '../utils/utils';

export function getPanelFrameCategory2(
  panel: VizPanel,
  layoutElementState: SceneObjectState
): OptionsPaneCategoryDescriptor {
  const descriptor = new OptionsPaneCategoryDescriptor({
    title: 'Panel options',
    id: 'Panel options',
    isOpenDefault: true,
  });

  const panelLinksObject = dashboardSceneGraph.getPanelLinks(panel);
  const links = panelLinksObject?.state.rawLinks ?? [];
  const dashboard = getDashboardSceneFor(panel);
  const layoutElement = panel.parent;

  descriptor
    .addItem(
      new OptionsPaneItemDescriptor({
        title: 'Title',
        value: panel.state.title,
        popularRank: 1,
        render: function renderTitle() {
          return <PanelFrameTitle panel={panel} />;
        },
        addon: config.featureToggles.dashgpt && (
          <GenAIPanelTitleButton
            onGenerate={(title) => setPanelTitle(panel, title)}
            panel={vizPanelToPanel(panel)}
            dashboard={transformSceneToSaveModel(dashboard)}
          />
        ),
      })
    )
    .addItem(
      new OptionsPaneItemDescriptor({
        title: 'Description',
        value: panel.state.description,
        render: function renderDescription() {
          return <DescriptionTextArea panel={panel} />;
        },
        addon: config.featureToggles.dashgpt && (
          <GenAIPanelDescriptionButton
            onGenerate={(description) => panel.setState({ description })}
            panel={vizPanelToPanel(panel)}
          />
        ),
      })
    )
    .addItem(
      new OptionsPaneItemDescriptor({
        title: 'Transparent background',
        render: function renderTransparent() {
          return (
            <Switch
              value={panel.state.displayMode === 'transparent'}
              id="transparent-background"
              onChange={() => {
                panel.setState({
                  displayMode: panel.state.displayMode === 'transparent' ? 'default' : 'transparent',
                });
              }}
            />
          );
        },
      })
    )
    .addCategory(
      new OptionsPaneCategoryDescriptor({
        title: 'Panel links',
        id: 'Panel links',
        isOpenDefault: false,
        itemsCount: links?.length,
      }).addItem(
        new OptionsPaneItemDescriptor({
          title: 'Panel links',
          render: () => <ScenePanelLinksEditor panelLinks={panelLinksObject ?? undefined} />,
        })
      )
    );

  if (layoutElement instanceof DashboardGridItem) {
    const gridItem = layoutElement;

    const category = new OptionsPaneCategoryDescriptor({
      title: 'Repeat options',
      id: 'Repeat options',
      isOpenDefault: false,
    });

    category.addItem(
      new OptionsPaneItemDescriptor({
        title: 'Repeat by variable',
        description:
          'Repeat this panel for each value in the selected variable. This is not visible while in edit mode. You need to go back to dashboard and then update the variable or reload the dashboard.',
        render: function renderRepeatOptions() {
          return (
            <RepeatRowSelect2
              id="repeat-by-variable-select"
              sceneContext={panel}
              repeat={gridItem.state.variableName}
              onChange={(value?: string) => gridItem.setRepeatByVariable(value)}
            />
          );
        },
      })
    );

    category.addItem(
      new OptionsPaneItemDescriptor({
        title: 'Repeat direction',
        showIf: () => Boolean(gridItem.state.variableName),
        render: function renderRepeatOptions() {
          const directionOptions: Array<SelectableValue<'h' | 'v'>> = [
            { label: 'Horizontal', value: 'h' },
            { label: 'Vertical', value: 'v' },
          ];

          return (
            <RadioButtonGroup
              options={directionOptions}
              value={gridItem.state.repeatDirection ?? 'h'}
              onChange={(value) => gridItem.setState({ repeatDirection: value })}
            />
          );
        },
      })
    );

    category.addItem(
      new OptionsPaneItemDescriptor({
        title: 'Max per row',
        showIf: () => Boolean(gridItem.state.variableName && gridItem.state.repeatDirection === 'h'),
        render: function renderOption() {
          const maxPerRowOptions = [2, 3, 4, 6, 8, 12].map((value) => ({ label: value.toString(), value }));
          return (
            <Select
              options={maxPerRowOptions}
              value={gridItem.state.maxPerRow ?? 4}
              onChange={(value) => gridItem.setState({ maxPerRow: value.value })}
            />
          );
        },
      })
    );

    descriptor.addCategory(category);
  }

  return descriptor;
}

interface ScenePanelLinksEditorProps {
  panelLinks?: VizPanelLinks;
}

function ScenePanelLinksEditor({ panelLinks }: ScenePanelLinksEditorProps) {
  const { rawLinks: links } = panelLinks ? panelLinks.useState() : { rawLinks: [] };

  return (
    <DataLinksInlineEditor
      links={links}
      onChange={(links) => panelLinks?.setState({ rawLinks: links })}
      getSuggestions={getPanelLinksVariableSuggestions}
      data={[]}
    />
  );
}

function PanelFrameTitle({ panel }: { panel: VizPanel }) {
  const { title } = panel.useState();

  return (
    <Input
      data-testid={selectors.components.PanelEditor.OptionsPane.fieldInput('Title')}
      value={title}
      onChange={(e) => setPanelTitle(panel, e.currentTarget.value)}
    />
  );
}

function DescriptionTextArea({ panel }: { panel: VizPanel }) {
  const { description } = panel.useState();

  return (
    <TextArea
      id="description-text-area"
      value={description}
      onChange={(e) => panel.setState({ description: e.currentTarget.value })}
    />
  );
}

function setPanelTitle(panel: VizPanel, title: string) {
  panel.setState({ title: title, hoverHeader: getUpdatedHoverHeader(title, panel.state.$timeRange) });
}

export function getUpdatedHoverHeader(title: string, timeRange: SceneTimeRangeLike | undefined): boolean {
  if (title !== '') {
    return false;
  }

  if (timeRange instanceof PanelTimeRange && !timeRange.state.hideTimeOverride) {
    if (timeRange.state.timeFrom || timeRange.state.timeShift) {
      return false;
    }
  }

  return true;
}
