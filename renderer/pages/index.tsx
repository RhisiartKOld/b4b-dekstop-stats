import React, { useContext, useEffect, useState } from 'react'
import { Dropzone, DropzoneStatus } from '@mantine/dropzone'
import { File, Icon as TablerIcon, Upload, X } from 'tabler-icons-react'
import { Center, Code, Group, List, MantineTheme, Text, ThemeIcon, Title, useMantineTheme } from '@mantine/core'
import { jsonUtils } from '../utils/utils'
import { AppContext } from '../utils/appContext'

function getIconColor (status: DropzoneStatus, theme: MantineTheme) {
  return status.accepted
    ? theme.colors[theme.primaryColor][theme.colorScheme === 'dark' ? 4 : 6]
    : status.rejected
      ? theme.colors.red[theme.colorScheme === 'dark' ? 4 : 6]
      : theme.colorScheme === 'dark'
        ? theme.colors.dark[0]
        : theme.colors.gray[7]
}

function ImageUploadIcon ({
  status,
  ...props
}: React.ComponentProps<TablerIcon> & { status: DropzoneStatus }) {
  if (status.accepted) {
    return <Upload {...props} />
  }

  if (status.rejected) {
    return <X {...props} />
  }

  return <File {...props} />
}

export const dropzoneChildren = (status: DropzoneStatus, theme: MantineTheme) => (
  <Group position="center" spacing="xl" style={{ minHeight: 220, pointerEvents: 'none' }}>
    <ImageUploadIcon status={status} style={{ color: getIconColor(status, theme) }} size={80}/>

    <div>
      <Text size="xl" inline>
        Drag your stat file here or click to select the file
      </Text>
      <Text size="sm" color="dimmed" inline mt={7}>
        To find your stat file, please follow the instructions above
      </Text>
    </div>
  </Group>
)

const IndexPage: React.FC<{ loadingStatsAutomatically: boolean }> = ({
  loadingStatsAutomatically
}) => {
  const { setLoading } = useContext(AppContext)
  const theme = useMantineTheme()
  const [path, setPath] = useState<string>()
  const [triedFindPath, setTriedFindPath] = useState(false)
  const [selectedStore, setSelectedStore] = useState<string>()

  const [damageInflected, setDamageInflected] = useState<Array<number>>([])
  const [latestJson, setLatestJson] = useState<number | null>(null)

  useEffect(() => {
    if (latestJson !== null) {
      if (damageInflected.length === 0) {
        setDamageInflected([latestJson])
      } else if (damageInflected[damageInflected.length - 1] < latestJson) {
        setDamageInflected([...damageInflected, latestJson])
      }
    }
  }, [latestJson])

  const acceptedFile = (files) => {
    console.log(files[0].path)
    const jsonPath = files[0].path

    global.ipcRenderer.send('path', jsonPath)
    global.ipcRenderer.on('json', (_event, json: any) => {
      setLatestJson(json)
    })
  }

  useEffect(() => {
    const devPath = 'C:\\Users\\krics\\Desktop\\json test\\PlayerProfileSettings_1.json'
    const devPath2 = 'C:\\Users\\krics\\Desktop\\json test\\PlayerProfileSettings_2.json'
    global.ipcRenderer.send('path', { path1: devPath, path2: devPath2 })
    global.ipcRenderer.on('json', (_event, jsons: any) => {
      setLatestJson(jsons.json1)
      jsonUtils.jsonChanges(jsons.json1, jsons.json2)

      // global.ipcRenderer.send('save', { type: 'player', json: jsons.json1 })
    })
  }, [])

  const Icon: React.FC<{ color?: string, gradient?: string, type: 'steam' | 'epic' | 'xbox' | 'file' }> = ({
    color,
    type,
    gradient
  }) => {
    let css = {}
    if (gradient !== undefined) {
      css = {
        backgroundImage: gradient
      }
    } else if (color) {
      css = {
        backgroundColor: color
      }
    }

    return (
      <ThemeIcon size={28} radius="xl" sx={css} style={{ marginTop: '.5em' }}>
        {type === 'steam' &&
          <img src="/images/steam.svg" alt="Steam" className="h-8 w-8"/>}
        {type === 'epic' && <img src="/images/epic_games.svg" alt="Steam" className="h-8 w-8"/>}
        {type === 'xbox' && <img src="/images/xbox.svg" alt="Steam" className="h-8 w-8"/>}
        {type === 'file' && <File/>}
      </ThemeIcon>
    )
  }

  const onClickStore = (event: React.MouseEvent<HTMLLIElement>) => {
    setSelectedStore(event.currentTarget.dataset['type'])
    setTriedFindPath(false)
    // Try to locate the statistics file
    if (event.currentTarget.dataset['type'] === 'file') {
      setTriedFindPath(true)
    } else {
      setLoading(true)
      global.ipcRenderer.send('findPath', { type: event.currentTarget.dataset['type'] })
    }
    global.ipcRenderer.once('findPathSuccess', (_event, data: { path: string }) => {
      setLoading(false)
      setPath(data.path)
      setTriedFindPath(true)
    })
    global.ipcRenderer.once('findPathError', () => {
      setLoading(false)
      setTriedFindPath(true)
    })
  }

  return loadingStatsAutomatically === true ? (
    <Center style={{ height: '100%', width: '100%' }}>
      <Title order={1}>Trying to load stats automatically...</Title>
    </Center>
  ) : (
    <div>
      <Center style={{ width: '100%', marginBottom: '1em' }}>
        <Title order={1}>Settings</Title>
      </Center>
      {path === undefined && <>
        <Title order={2} style={{ marginBottom: '.5em' }}>1. Select your game store or read from file</Title>
        <List style={{ display: 'inline-block' }}>
          <List.Item icon={Icon({ gradient: 'linear-gradient(#00adee, #000000)', type: 'steam' })}
                     onClick={onClickStore}
                     data-type="steam" style={{ cursor: 'pointer' }}>
            <Center style={{ height: '36px' }}><Text size={'xl'} weight={'bold'}>Steam</Text></Center>
          </List.Item>
          <List.Item icon={Icon({ color: '#107C10', type: 'xbox' })} onClick={onClickStore} data-type="xbox"
                     style={{ cursor: 'pointer' }}>
            <Center style={{ height: '36px' }}><Text size={'xl'} weight={'bold'}>Xbox Game Pass</Text></Center>
          </List.Item>
          <List.Item icon={Icon({ color: '#2F2D2E', type: 'epic' })} onClick={onClickStore} data-type="epic"
                     style={{ cursor: 'pointer' }}>
            <Center style={{ height: '36px' }}><Text size={'xl'} weight={'bold'}>Epic Games Store</Text></Center>
          </List.Item>
          <List.Item icon={Icon({ color: '#2F2D2E', type: 'file' })} onClick={onClickStore} data-type="file"
                     style={{ cursor: 'pointer' }}>
            <Center style={{ height: '36px' }}><Text size={'xl'} weight={'bold'}>File</Text></Center>
          </List.Item>
        </List>
        {triedFindPath && <>
          <Title order={2} style={{ marginBottom: '.5em', marginTop: '.5em' }}>2. Locate your statistics file</Title>
          {selectedStore === 'steam' && <>
            <div className="my-6">
              <Text>By default, you should find your statistics file at path:</Text>
              <Code
                color={'red'} style={{
                fontWeight: 'bold',
                padding: '1em'
              }}>{'<disk>:\\Users\\<username>\\AppData\\Local\\Back4Blood\\Steam\\Saved\\SaveGames\\PlayerProfileSettings.json'}</Code>
            </div>
          </>}
          {selectedStore === 'xbox' && <>
            <div className="my-6">
              <Text>Please note that Xbox Game Pass stores your files differently (within sub folders), so you'll have
                to try
                several files until you have it displayed.</Text>
              <Text>By default, you should find your statistics file somewhere in:</Text>
              <Code
                color={'red'} style={{
                fontWeight: 'bold',
                padding: '1em'
              }}>{'<disk>:\\Users\\<username>\\AppData\\Local\\Packages\\WarnerBros.Interactive.<some key>\\SystemAppData\\wgs\\'}</Code>
            </div>
          </>}
          {selectedStore === 'epic' && <>
            <div className="my-6">
              <Text>By default, you should find your statistics file at:</Text>
              <Code
                color={'red'} style={{
                fontWeight: 'bold',
                padding: '1em'
              }}>{'<disk>:\\Users\\<username>\\AppData\\Local\\Back4Blood\\Epic\\Saved\\SaveGames\\PlayerProfileSettings.json'}</Code>
            </div>
          </>}
          <div className="text-sm mt-6">
            <Text>Please note that Windows hide some folders by default (AppData being one of them), if you can't see
              it, show hidden folders in your Windows settings.</Text>
          </div>

          <Dropzone
            onDrop={acceptedFile}
            onReject={(files) => console.log('rejected files', files)}
            maxSize={3 * 1024 ** 2}
            style={{ marginTop: '.5em' }}
          >
            {(status) => dropzoneChildren(status, theme)}
          </Dropzone>
        </>}
      </>}
      {path !== undefined && <>
        <Title order={2} style={{ marginBottom: '.5em', marginTop: '.5em' }}>Currently used statistic file</Title>
        <Title order={3} style={{ marginBottom: '.5em', marginTop: '.5em' }}>{selectedStore}</Title>
        <Code>{path}</Code>
      </>}
    </div>
  )
}

export default IndexPage
