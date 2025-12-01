import Image from 'next/image';
import { Card, CardContent, Typography, CardActionArea } from '@mui/material';
import { GiftItem } from '@/types/gift';

interface Props {
  item: GiftItem;
  selected: boolean;
  onToggle: (item: GiftItem) => void;
}
export default function TokenCard({ item, selected, onToggle }: Props) {
  return (
    <Card variant={selected ? 'outlined' : undefined} sx={{ height: '100%' }}>
      <CardActionArea onClick={() => onToggle(item)} sx={{ height: '100%' }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Image src={item.image || '/token.png'} alt={item.name} height={48} width={48} style={{ marginBottom: 8 }} />
          <Typography fontWeight={700}>{item.name}</Typography>
          {item.symbol && <Typography variant="body2" color="text.secondary">{item.symbol}</Typography>}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
