import { createTheme } from "@mui/material/styles";

const radius = 12;
const radiusSmall = 8;
const SERIF = '"Playfair Display", Georgia, "Times New Roman", serif';
const SANS = '"Inter", "Montserrat", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

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
    fontFamily: SANS,
    h1: {
      fontFamily: SERIF,
      fontWeight: 900,
      letterSpacing: "-0.03em",
      lineHeight: 0.97,
    },
    h2: {
      fontFamily: SERIF,
      fontWeight: 900,
      letterSpacing: "-0.025em",
      lineHeight: 0.97,
    },
    h3: {
      fontFamily: SERIF,
      fontWeight: 700,
      letterSpacing: "-0.02em",
      lineHeight: 1.05,
    },
    h4: {
      fontFamily: SERIF,
      fontWeight: 700,
      letterSpacing: "-0.015em",
      lineHeight: 1.1,
    },
    h5: {
      fontFamily: SANS,
      fontWeight: 900,
      letterSpacing: "-0.02em",
    },
    h6: {
      fontFamily: SANS,
      fontWeight: 900,
    },
    button: {
      fontFamily: SANS,
      fontWeight: 800,
      letterSpacing: "0.02em",
    },
    overline: {
      fontFamily: SANS,
      fontWeight: 800,
      letterSpacing: "0.2em",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: [
            "radial-gradient(ellipse 90% 55% at -8% -8%, rgba(200,164,93,0.32) 0%, transparent 55%)",
            "radial-gradient(ellipse 70% 50% at 108% 108%, rgba(93,63,36,0.16) 0%, transparent 55%)",
            "radial-gradient(ellipse 55% 35% at 55% 115%, rgba(29,22,18,0.07) 0%, transparent 50%)",
            "radial-gradient(ellipse 45% 28% at 100% 0%, rgba(200,164,93,0.12) 0%, transparent 45%)",
            "linear-gradient(170deg, #fdf9f3 0%, #fbf4ea 45%, #f8efe4 100%)",
          ].join(", "),
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "rgba(255, 253, 248, 0.92)",
          color: "#1d1612",
          borderBottom: "1px solid rgba(67, 48, 34, 0.10)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: radiusSmall,
          textTransform: "none",
          boxShadow: "none",
          fontWeight: 800,
        },
        contained: {
          boxShadow: "0 8px 24px rgba(29, 22, 18, 0.18)",
          "&:hover": { boxShadow: "0 12px 32px rgba(29, 22, 18, 0.26)" },
        },
        outlined: {
          borderWidth: "1.5px",
          "&:hover": { borderWidth: "1.5px" },
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
        elevation1: {
          boxShadow: "0 4px 16px rgba(29,22,18,0.07)",
        },
        elevation10: {
          boxShadow: "0 20px 60px rgba(29,22,18,0.16)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: radius,
          border: "1px solid rgba(67, 48, 34, 0.10)",
          boxShadow: "0 4px 20px rgba(29, 22, 18, 0.07)",
          transition: "box-shadow 350ms ease, transform 350ms ease",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 800,
          letterSpacing: "0.01em",
          fontSize: "0.75rem",
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
          backgroundColor: "rgba(255,253,248,0.9)",
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
          fontWeight: 800,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "rgba(67,48,34,0.12)",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 6,
          fontWeight: 700,
          fontSize: "0.78rem",
        },
      },
    },
  },
});
