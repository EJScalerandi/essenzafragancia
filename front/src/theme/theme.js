import { createTheme } from "@mui/material/styles";

const squareRadius = 8;
const squareRadiusSmall = 6;

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#111111", contrastText: "#ffffff" },
    secondary: { main: "#9f8f72", contrastText: "#111111" },
    background: { default: "#f7f4ef", paper: "#ffffff" },
    text: { primary: "#111111", secondary: "#5e5a54" },
    divider: "rgba(17, 17, 17, 0.12)",
  },
  shape: {
    borderRadius: squareRadius,
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
    h2: { fontWeight: 950, letterSpacing: "-0.05em" },
    h3: { fontWeight: 950, letterSpacing: "-0.045em" },
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
            "radial-gradient(circle at top left, rgba(159, 143, 114, 0.18), transparent 34rem), #f7f4ef",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "rgba(255, 255, 255, 0.86)",
          color: "#111111",
          borderBottom: "1px solid rgba(17, 17, 17, 0.10)",
          backdropFilter: "blur(16px)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: squareRadius,
          textTransform: "none",
          boxShadow: "none",
        },
        contained: {
          boxShadow: "0 12px 26px rgba(17, 17, 17, 0.14)",
          "&:hover": { boxShadow: "0 14px 30px rgba(17, 17, 17, 0.20)" },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: squareRadius,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: squareRadius,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: squareRadius,
          border: "1px solid rgba(17, 17, 17, 0.10)",
          boxShadow: "0 14px 34px rgba(17, 17, 17, 0.08)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: squareRadiusSmall,
          fontWeight: 750,
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
          borderRadius: squareRadius,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: squareRadius,
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
          borderRadius: squareRadiusSmall,
        },
      },
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          borderRadius: squareRadiusSmall,
        },
      },
    },
  },
});
