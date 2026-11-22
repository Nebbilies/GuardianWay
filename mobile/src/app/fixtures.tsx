import { useEffect, useState } from 'react';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/app-text';
import { Stack } from '@/components/stack';
import { Button } from '@/components/ui';
import { preview, scenarios } from '../../../fixtures/transport/preview';
export default function FixtureScreen() {
  const [index, select] = useState(0);
  const [rows, setRows] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    if (__DEV__)
      preview(scenarios[index]).then((lines) => {
        if (active) setRows(lines);
      });
    return () => {
      active = false;
    };
  }, [index]);
  return (
    <Screen scroll>
      <Stack gap="md">
        <AppText variant="sectionTitle">
          Fixture đăng ký và vận hành chuyến
        </AppText>
        <AppText>{scenarios[index].label}</AppText>
        {rows.map((line) => (
          <AppText key={line}>{line}</AppText>
        ))}
        {scenarios.map((s, i) => (
          <Button
            key={s.label}
            size="compact"
            variant={index === i ? 'primary' : 'secondary'}
            onPress={() => select(i)}
          >
            {s.label}
          </Button>
        ))}
      </Stack>
    </Screen>
  );
}
