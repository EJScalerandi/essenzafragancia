import { createTheme } from "@mui/material/styles";

const radius = 14;
const radiusSmall = 10;

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1d1612", contrastText: "#ffffff" },
    secondary: { main: "#c8a45d", contrastText: "#1d1612" },
    background: { default: "#fbf6ee", paper: "#fffdf8" },
    text: { primary: "#1d1612", secondary: "#6f6254" },
    divider: "rgba(67, 48, 34, 0.13)",
    error: { main: "#8f332d" },
    success: { main: "#4d6a46" },
  },
  shape: {
    borderRadius: radius,
  },
  typography: {
    fontFamily: [
      "Inter",
      "Montserrat",
      "system-ui",
      "-apple-system",
      "Segoe UI",
      "Roboto",
      "Arial",
      "sans-serif",
    ].join(","),
    h1: { fontWeight: 950, letterSpacing: "-0.06em" },
    h2: { fontWeight: 950, letterSpacing: "-0.055em" },
    h3: { fontWeight: 930, letterSpacing: "-0.045em" },
    h4: { fontWeight: 900, letterSpacing: "-0.035em" },
    h5: { fontWeight: 900, letterSpacing: "-0.025em" },
    h6: { fontWeight: 900 },
    button: { fontWeight: 850, letterSpacing: "0.02em" },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            "radial-gradient(circle at top left, rgba(200, 164, 93, 0.22), transparent 34rem), radial-gradient(circle at bottom right, rgba(93, 63, 36, 0.10), transparent 30rem), #fbf6ee",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "rgba(255, 253, 248, 0.88)",
          color: "#1d1612",
          borderBottom: "1px solid rgba(67, 48, 34, 0.12)",
          backdropFilter: "blur(16px)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: radiusSmall,
          textTransform: "none",
          boxShadow: "none",
        },
        contained: {
          boxShadow: "0 16px 34px rgba(29, 22, 18, 0.16)",
          "&:hover": { boxShadow: "0 18px 38px rgba(29, 22, 18, 0.22)" },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: radiusSmall,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: radius,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: radius,
          border: "1px solid rgba(67, 48, 34, 0.12)",
          boxShadow: "0 18px 42px rgba(29, 22, 18, 0.08)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: radiusSmall,
          fontWeight: 800,
          letterSpacing: "0.01em",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: radiusSmall,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: radius,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        rounded: {
          borderRadius: radiusSmall,
        },
      },
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          borderRadius: radiusSmall,
        },
      },
    },
  },
});
