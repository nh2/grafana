import React, { useEffect, useState } from 'react';

import { Button, Card, Drawer, Tab, TabContent, TabsBar, ToolbarButton, ToolbarButtonRow } from '@grafana/ui';
import { useGrafana } from 'app/core/context/GrafanaContext';

import { useAppNotification } from '../../../../core/copy/appNotification';
import { ExploreWorkspace, ExploreWorkspaceSnapshot } from '../types';
import { useExploreWorkspaces } from '../utils/hooks';

import { ExploreWorkspaceSnapshotsList } from './ExploreWorkspaceSnapshotsList';
import { ExploreWorkspacesList } from './ExploreWorkspacesList';
import { NewExploreWorkspaceFormModal } from './NewExploreWorkspaceForm';
import { NewExploreWorkspaceSnapshotFormModal } from './NewExploreWorkspaceSnapshotForm';

type Props = {
  loadedWorkspace?: ExploreWorkspace;
  loadedSnapshot?: ExploreWorkspaceSnapshot;
  currentState?: string;
};

export const ExploreWorkspacesMenu = (props: Props) => {
  const { loadedWorkspace, loadedSnapshot, currentState } = props;

  const {
    workspaces,
    createExploreWorkspace,
    createExploreWorkspaceSnapshot,
    deleteExploreWorkspace,
    deleteExploreWorkspaceSnapshot,
    getExploreWorkspaceSnapshots,
    reload,
  } = useExploreWorkspaces();
  const { location } = useGrafana();
  const notifyApp = useAppNotification();

  const [isOpen, setIsOpen] = useState(false);
  const [loadedSnapshots, setLoadedSnapshots] = useState<ExploreWorkspaceSnapshot[] | undefined>(undefined);

  if (!currentState) {
    return <></>;
  }

  const showLatestHandler = () => {
    if (loadedWorkspace) {
      location.push('/explore/' + loadedWorkspace.uid);
      window.location.reload();
    }
  };

  const createExploreWorkspaceHandler = async (data: Pick<ExploreWorkspace, 'name' | 'description'>) => {
    const workspace = await createExploreWorkspace({
      name: data.name,
      description: data.description,
      config: currentState,
    });
    location.push('/explore/' + workspace.uid);
    notifyApp.success('Explore Workspace created successfully.');
  };

  const takeSnapshotHandler = async (data: Pick<ExploreWorkspaceSnapshot, 'name' | 'description'>) => {
    if (loadedWorkspace) {
      await createExploreWorkspaceSnapshot({
        name: data.name,
        description: data.description,
        exploreWorkspaceUID: loadedWorkspace.uid,
        config: currentState,
      });
      notifyApp.success('Snapshot created successfully.');
    }
  };

  const reloadSnapshots = async () => {
    if (loadedWorkspace) {
      const snapshotsResponse = await getExploreWorkspaceSnapshots({
        exploreWorkspaceUid: loadedWorkspace.uid,
      });
      setLoadedSnapshots(snapshotsResponse.snapshots.slice(1));
    }
  };

  const loadWorkspacesAndSnapshotsHandler = async () => {
    setIsOpen(true);
    await reload();
    await reloadSnapshots();
  };

  const loadSnapshotHandler = async (snapshot: ExploreWorkspaceSnapshot) => {
    if (loadedWorkspace) {
      setIsOpen(false);
      location.push('/explore/' + loadedWorkspace.uid + '/' + snapshot.uid);
    }
  };

  const deleteWorkspaceHandler = async (workspace: ExploreWorkspace) => {
    await deleteExploreWorkspace(workspace.uid);
    notifyApp.success('Explore Workspace deleted successfully.');
  };

  const deleteSnapshotHandler = async (snapshot: ExploreWorkspaceSnapshot) => {
    await deleteExploreWorkspaceSnapshot(snapshot.uid);
    notifyApp.success('Explore Workspace snapshot deleted successfully.');
    await reloadSnapshots();
  };

  const CreateWorkspace = ({ nav }: { nav: boolean }) => {
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    return (
      <>
        {nav && (
          <Button size="sm" fill="outline" variant={'primary'} icon="plus" onClick={() => setIsDialogOpen(true)}>
            workspace
          </Button>
        )}
        {!nav && (
          <Button variant={'secondary'} onClick={() => setIsDialogOpen(true)}>
            Fork to a new workspace
          </Button>
        )}
        {isDialogOpen && (
          <NewExploreWorkspaceFormModal
            isOpen={isOpen}
            onCancel={() => setIsOpen(false)}
            onSave={(data) => {
              setIsOpen(false);
              createExploreWorkspaceHandler(data);
            }}
          />
        )}
      </>
    );
  };

  const WorkspaceInfo = () => {
    let name = '';
    if (loadedSnapshot && loadedWorkspace) {
      name = `${loadedSnapshot.name} (${loadedWorkspace.name})`;
    } else if (loadedWorkspace) {
      name = `${loadedWorkspace.name}`;
    }

    return loadedWorkspace ? (
      <div>
        <span>
          <em>{name}</em>
        </span>
        <span style={{ opacity: 0.5 }}>
          <em> ({new Date(loadedWorkspace.activeSnapshot.updated).toLocaleString()})</em>
        </span>
      </div>
    ) : undefined;
  };

  const ListWorkspacesAndSnapshots = () => {
    const [activeTab, setActiveTab] = useState('snapshots');

    useEffect(() => {
      if (!loadedWorkspace) {
        setActiveTab('workspaces');
      } else {
        setActiveTab('info');
      }
    }, []);

    return (
      <>
        <ToolbarButton
          aria-label="List snapshots & workspaces"
          icon="list-ul"
          onClick={() => loadWorkspacesAndSnapshotsHandler()}
        ></ToolbarButton>
        {isOpen && (
          <Drawer onClose={() => setIsOpen(false)}>
            <TabsBar>
              {loadedWorkspace && <Tab label="Current" onChangeTab={() => setActiveTab('info')} />}
              {loadedWorkspace && (
                <Tab
                  label="Snapshots"
                  counter={loadedSnapshots?.length}
                  onChangeTab={() => setActiveTab('snapshots')}
                />
              )}
              <Tab label="Workspaces" counter={workspaces.length} onChangeTab={() => setActiveTab('workspaces')} />
            </TabsBar>
            <TabContent>
              {activeTab === 'info' && loadedWorkspace && (
                <div>
                  <Card>
                    <Card.Heading>Workspace: {loadedWorkspace.name}</Card.Heading>
                    <Card.Description>{loadedWorkspace.description}</Card.Description>
                    <Card.Meta>
                      <span>
                        Created: {new Date(loadedWorkspace.activeSnapshot.created).toLocaleString()} (by{' '}
                        {loadedWorkspace.user.Login})
                      </span>
                      <span>
                        Updated: {new Date(loadedWorkspace.activeSnapshot.updated).toLocaleString()} (by{' '}
                        {loadedWorkspace.activeSnapshot.user?.Login})
                      </span>
                    </Card.Meta>
                    <Card.Actions>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setIsOpen(false);
                          location.push('/explore/' + loadedWorkspace.uid);
                        }}
                      >
                        Reload workspace
                      </Button>
                      <CreateWorkspace nav={false} />
                    </Card.Actions>
                  </Card>
                  {loadedSnapshot && (
                    <Card>
                      <Card.Heading>Snapshot: {loadedSnapshot.name}</Card.Heading>
                      <Card.Description>{loadedSnapshot.description}</Card.Description>
                      <Card.Meta>
                        <span>
                          Created: {new Date(loadedSnapshot.created).toLocaleString()} (by {loadedSnapshot.user.Login})
                        </span>
                        <span>
                          Updated: {new Date(loadedSnapshot.updated).toLocaleString()} (by {loadedSnapshot.user.Login})
                        </span>
                      </Card.Meta>
                      <Card.Actions>
                        <Button icon="sync" onClick={() => {}}>
                          reload
                        </Button>
                      </Card.Actions>
                    </Card>
                  )}
                </div>
              )}
              {activeTab === 'snapshots' && (
                <ExploreWorkspaceSnapshotsList
                  current={loadedSnapshot?.uid}
                  snapshots={loadedSnapshots}
                  deleted={(snapshot: ExploreWorkspaceSnapshot) => {
                    deleteSnapshotHandler(snapshot);
                  }}
                  selected={(snapshot) => {
                    if (snapshot) {
                      loadSnapshotHandler(snapshot);
                    } else {
                      showLatestHandler();
                    }
                  }}
                />
              )}
              {activeTab === 'workspaces' && (
                <ExploreWorkspacesList
                  current={loadedWorkspace?.uid}
                  workspaces={workspaces}
                  deleted={(workspace: ExploreWorkspace) => {
                    deleteWorkspaceHandler(workspace);
                  }}
                  selected={(workspace) => {
                    setIsOpen(false);
                    location.push('/explore/' + workspace.uid);
                  }}
                />
              )}
            </TabContent>
          </Drawer>
        )}
      </>
    );
  };

  // const ShowLatest = () => <ToolbarButton icon="sync" variant="default" onClick={showLatestHandler}></ToolbarButton>;
  const TakeSnapshot = () => {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    return (
      <>
        <ToolbarButton icon="capture" variant="primary" onClick={() => setIsOpen(true)}></ToolbarButton>
        {isOpen && (
          <NewExploreWorkspaceSnapshotFormModal
            isOpen={isOpen}
            onCancel={() => setIsOpen(false)}
            onSave={(data) => {
              takeSnapshotHandler(data).then(() => setIsOpen(false));
            }}
          />
        )}
      </>
    );
  };

  return (
    <ToolbarButtonRow>
      {!loadedWorkspace ? <CreateWorkspace nav={true} /> : undefined}
      {loadedWorkspace ? <WorkspaceInfo /> : undefined}
      {loadedWorkspace ? <TakeSnapshot /> : undefined}
      <ListWorkspacesAndSnapshots />
    </ToolbarButtonRow>
  );
};
