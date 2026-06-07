export const TAB_STYLES = {
  tab: {
    backgroundColor: "#141414",
    color: "#888",
    border: "1px solid #2a2a2a",
    "&[data-active]": {
      background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
      color: "white",
      borderColor: "transparent",
    },
  },
} as const
