'use client';
import {
  Container,
  Typography,
  Button,
  Paper,
  Stack,
} from '@mui/material';
import Section from '@/components/Section';
import LaunchIcon from '@mui/icons-material/Launch';

export default function WhyPage() {
  return (
    <Section>
      <Container maxWidth="md">
        <Paper
          sx={{
            p: { xs: 4, md: 6 },
            textAlign: 'center',
            borderRadius: 4,
          }}
        >
          <Typography variant="h3" fontWeight={800} mb={3}>
            Why&nbsp;DogeGF&nbsp;?
          </Typography>

          <Typography fontSize={18} mb={4}>
            “DogeGF stands for kindness, community, and heart. With DogeGiFty,
            we’re turning that into action—empowering everyday people to spread
            kindness in a fun, decentralized way.”
          </Typography>

          <Stack spacing={2} alignItems="center">
            <Button
              variant="contained"
              endIcon={<LaunchIcon />}
              href="https://dogegf.com"
              target="_blank"
              sx={{
                bgcolor: 'primary.main',
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 999,
                px: 5,
                py: 1.25,
                '&:hover': { bgcolor: 'primary.dark' },
              }}
            >
              Learn more about DogeGF
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Section>
  );
}
