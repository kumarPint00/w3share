'use client';
import { Container, Typography, Box, Stack, Paper } from '@mui/material';
import Section from '@/components/Section';

export default function LearnPage() {
  return (
    <Section>
      <Container maxWidth="md">
        <Typography variant="h2" fontWeight={800} textAlign="center" mb={6}>
          Learn about&nbsp;DogeGiFty
        </Typography>

        <Stack spacing={4}>
          {[
            {
              hdr: 'What is DogeGiFty?',
              body:
                'DogeGiFty is a new way to wrap kindness into a digital gift. Each gift pack combines a personal message with tokens, sealed by a secret code only the recipient can unlock. Simple, fun, and onchain, it\'s digital gifting designed for the blockchain age.',
            },
            {
              hdr: 'How does it work?',
              body:
                'When you create a gift, your tokens are held safely in escrow by a smart contract. The pack can\'t be opened without the secret code. This means your gift is secure until the right person unlocks it, making every reveal a true surprise. Each gift is personal, private, and powered by the blockchain. Want to dive deeper? Check out our full article on Medium.',
            },
            {
              hdr: 'Why DogeGF?',
              body:
                'DogeGF is more than a meme token, it\'s the heart of a movement built on kindness. Holding DogeGF fuels DogeGiFty and future platforms designed to spread love and generosity. From powering gift packs to enabling future feature drops, community rewards, and other integrations, DogeGF turns kindness into real utility on the blockchain.',
            },
          ].map((s) => (
            <Paper key={s.hdr} sx={{ p: 4, borderRadius: 4 }}>
              <Typography variant="h6" fontWeight={700} mb={1}>
                {s.hdr}
              </Typography>
              <Typography fontSize={15} color="text.secondary">
                {s.body}
              </Typography>
            </Paper>
          ))}
        </Stack>
      </Container>
    </Section>
  );
}
