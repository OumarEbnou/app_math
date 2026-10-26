import { Box } from '@mui/material'

export type AppIconName =
  | 'edit'
  | 'history'
  | 'home'
  | 'key'
  | 'mix'
  | 'play'
  | 'power'
  | 'replay'
  | 'scores'
  | 'search'
  | 'settings'
  | 'students'
  | 'table'
  | 'trash'
  | 'trophy'
  | 'userPlus'

const iconPaths: Record<AppIconName, string[]> = {
  home: ['M3 11.5 12 4l9 7.5', 'M5.5 10v10h13V10', 'M9.5 20v-6h5v6'],
  replay: ['M5 8V3m0 0h5M5 3l3 3', 'M5.5 8a8 8 0 1 1-1 7'],
  play: ['m8 5 11 7-11 7Z'],
  trash: ['M4 7h16', 'M9 7V4h6v3', 'm7 7 1 14h10l1-14', 'M10 11v6m4-6v6'],
  edit: ['m4 20 4.5-1 10-10-3.5-3.5-10 10Z', 'm13.5 6.5 3.5 3.5'],
  history: ['M3 12a9 9 0 1 0 3-6.7L3 8', 'M3 3v5h5', 'M12 7v5l3 2'],
  key: ['M15 7a5 5 0 1 1-4.5 7.2L4 20H2v-3l5.8-5.5A5 5 0 0 1 15 7Z', 'M14 7h.01'],
  mix: ['M4 6h3c5 0 5 12 10 12h3', 'm17 15 3 3-3 3', 'M4 18h3c2.1 0 3.3-2.1 4.5-4.7', 'M14 8.7C15 7 16 6 17 6h3', 'm17 3 3 3-3 3'],
  scores: ['M5 20V10h4v10', 'M10 20V4h4v16', 'M15 20v-7h4v7', 'M3 20h18'],
  search: ['M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z', 'm16 16 5 5'],
  power: ['M12 3v9', 'M7.1 5.6a8 8 0 1 0 9.8 0'],
  table: ['M4 5h16v14H4Z', 'M4 10h16M9 5v14m6-14v14'],
  trophy: ['M8 4h8v4a4 4 0 0 1-8 0Z', 'M8 6H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4', 'M12 12v5m-4 3h8m-7-3h6'],
  settings: ['M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z', 'M19 13.5v-3l-2-.7-.7-1.7.9-1.9-2.1-2.1-1.9.9-1.7-.7L10.5 2h-3l-.7 2-1.7.7-1.9-.9-2.1 2.1.9 1.9-.7 1.7-2 .7v3l2 .7.7 1.7-.9 1.9 2.1 2.1 1.9-.9 1.7.7.7 2h3l.7-2 1.7-.7 1.9.9 2.1-2.1-.9-1.9.7-1.7Z'],
  students: ['M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M2 21v-2a6 6 0 0 1 12 0v2', 'M16 4a4 4 0 0 1 0 7m1 4a6 6 0 0 1 5 6'],
  userPlus: ['M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M2 21v-2a7 7 0 0 1 14 0v2', 'M19 8v6m-3-3h6'],
}

export function AppIcon({ name, size = 22 }: { name: AppIconName; size?: number }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      sx={{ width: size, height: size, fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}
    >
      {iconPaths[name].map((path) => (
        <path key={path} d={path} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </Box>
  )
}
