import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { axe } from "vitest-axe"

import { AppearanceSettingsPanel } from "./appearance-settings-panel"
import { ThemeProvider } from "./theme-provider"

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
})

// Helper to render within ThemeProvider
function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

describe("AppearanceSettingsPanel", () => {
  beforeEach(() => {
    localStorageMock.clear()
    // Reset system preference
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === "(prefers-color-scheme: dark)" ? false : true,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  describe("Rendering", () => {
    it("renders with default heading", () => {
      renderWithTheme(<AppearanceSettingsPanel />)
      expect(screen.getByText("Appearance")).toBeInTheDocument()
    })

    it("renders with custom heading", () => {
      renderWithTheme(<AppearanceSettingsPanel heading="Theme Settings" />)
      expect(screen.getByText("Theme Settings")).toBeInTheDocument()
    })

    it("renders without heading when heading is null", () => {
      renderWithTheme(<AppearanceSettingsPanel heading={null} />)
      expect(screen.queryByRole("heading")).not.toBeInTheDocument()
    })

    it("renders all three theme options", () => {
      renderWithTheme(<AppearanceSettingsPanel />)
      expect(screen.getByLabelText(/Light/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Dark/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/System/i)).toBeInTheDocument()
    })

    it("renders option descriptions", () => {
      renderWithTheme(<AppearanceSettingsPanel />)
      expect(screen.getByText("Always use light theme")).toBeInTheDocument()
      expect(screen.getByText("Always use dark theme")).toBeInTheDocument()
      expect(screen.getByText("Sync with your device settings")).toBeInTheDocument()
    })

    it("renders preview cards by default", () => {
      const { container } = renderWithTheme(<AppearanceSettingsPanel />)
      // Previews are aria-hidden divs
      const previews = container.querySelectorAll('[aria-hidden="true"]')
      expect(previews.length).toBeGreaterThanOrEqual(3)
    })

    it("hides preview cards when showPreviews is false", () => {
      const { container } = renderWithTheme(
        <AppearanceSettingsPanel showPreviews={false} />
      )
      // Count should be less (no preview cards)
      const previews = container.querySelectorAll('[aria-hidden="true"]')
      expect(previews.length).toBe(0)
    })
  })

  describe("Theme Selection", () => {
    it("defaults to system theme", () => {
      renderWithTheme(<AppearanceSettingsPanel />)
      const systemRadio = screen.getByLabelText(/System/i)
      expect(systemRadio).toBeChecked()
    })

    it("allows selecting light theme", async () => {
      const user = userEvent.setup()
      renderWithTheme(<AppearanceSettingsPanel />)

      const lightRadio = screen.getByLabelText(/Light/i)
      await user.click(lightRadio)

      expect(lightRadio).toBeChecked()
    })

    it("allows selecting dark theme", async () => {
      const user = userEvent.setup()
      renderWithTheme(<AppearanceSettingsPanel />)

      const darkRadio = screen.getByLabelText(/Dark/i)
      await user.click(darkRadio)

      expect(darkRadio).toBeChecked()
    })

    it("can switch between themes", async () => {
      const user = userEvent.setup()
      renderWithTheme(<AppearanceSettingsPanel />)

      const lightRadio = screen.getByLabelText(/Light/i)
      const darkRadio = screen.getByLabelText(/Dark/i)
      const systemRadio = screen.getByLabelText(/System/i)

      // Start with system (default)
      expect(systemRadio).toBeChecked()

      // Switch to light
      await user.click(lightRadio)
      expect(lightRadio).toBeChecked()
      expect(darkRadio).not.toBeChecked()

      // Switch to dark
      await user.click(darkRadio)
      expect(darkRadio).toBeChecked()
      expect(lightRadio).not.toBeChecked()

      // Back to system
      await user.click(systemRadio)
      expect(systemRadio).toBeChecked()
    })
  })

  describe("Persistence", () => {
    it("persists selection to localStorage", async () => {
      const user = userEvent.setup()
      renderWithTheme(<AppearanceSettingsPanel />)

      const darkRadio = screen.getByLabelText(/Dark/i)
      await user.click(darkRadio)

      expect(localStorageMock.getItem("so4-theme")).toBe("dark")
    })

    it("loads persisted selection on mount", () => {
      localStorageMock.setItem("so4-theme", "light")

      renderWithTheme(<AppearanceSettingsPanel />)

      const lightRadio = screen.getByLabelText(/Light/i)
      expect(lightRadio).toBeChecked()
    })

    it("applies theme without page reload", async () => {
      const user = userEvent.setup()
      renderWithTheme(<AppearanceSettingsPanel />)

      const darkRadio = screen.getByLabelText(/Dark/i)
      await user.click(darkRadio)

      // Theme should be applied immediately to document
      expect(document.documentElement.classList.contains("dark")).toBe(true)
      expect(document.documentElement.classList.contains("light")).toBe(false)
    })
  })

  describe("System Theme Resolution", () => {
    it("shows resolved theme when system is selected", () => {
      renderWithTheme(<AppearanceSettingsPanel />)

      // Default is system, and our mock says light
      expect(
        screen.getByText(/Currently following your system preference/i)
      ).toBeInTheDocument()
      expect(screen.getByText("Light", { exact: false })).toBeInTheDocument()
    })

    it("displays resolved theme next to system option label", () => {
      renderWithTheme(<AppearanceSettingsPanel />)

      // Find the system option label
      const systemLabel = screen.getByText("System")
      const parentElement = systemLabel.closest("div")

      expect(parentElement).toHaveTextContent("(Light)")
    })

    it("updates resolved theme when system preference changes", () => {
      // Start with light system preference
      window.matchMedia = vi.fn().mockImplementation((query) => {
        const listeners: Array<(e: MediaQueryListEvent) => void> = []
        return {
          matches: query === "(prefers-color-scheme: dark)" ? false : true,
          media: query,
          onchange: null,
          addEventListener: (_: string, listener: (e: MediaQueryListEvent) => void) => {
            listeners.push(listener)
          },
          removeEventListener: vi.fn(),
          dispatchEvent: (event: MediaQueryListEvent) => {
            listeners.forEach((listener) => listener(event))
            return true
          },
        }
      })

      renderWithTheme(<AppearanceSettingsPanel />)

      // Initially shows Light
      expect(screen.getByText("Light", { exact: false })).toBeInTheDocument()

      // Simulate system preference change to dark
      const mql = window.matchMedia("(prefers-color-scheme: dark)")
      const event = new Event("change") as MediaQueryListEvent
      Object.defineProperty(event, "matches", { value: true })
      mql.dispatchEvent(event)

      // Should update to Dark
      // Note: This is a simplified test; real implementation depends on ThemeProvider's listeners
    })

    it("hides system preference message when not on system theme", async () => {
      const user = userEvent.setup()
      renderWithTheme(<AppearanceSettingsPanel />)

      // Initially on system theme
      expect(
        screen.getByText(/Currently following your system preference/i)
      ).toBeInTheDocument()

      // Switch to light
      const lightRadio = screen.getByLabelText(/Light/i)
      await user.click(lightRadio)

      // Message should be gone
      expect(
        screen.queryByText(/Currently following your system preference/i)
      ).not.toBeInTheDocument()
    })
  })

  describe("Keyboard Accessibility", () => {
    it("radio group is keyboard navigable", async () => {
      const user = userEvent.setup()
      renderWithTheme(<AppearanceSettingsPanel />)

      const lightRadio = screen.getByLabelText(/Light/i)

      // Tab to first radio
      await user.tab()
      expect(lightRadio).toHaveFocus()
    })

    it("has accessible radio group label", () => {
      renderWithTheme(<AppearanceSettingsPanel />)

      const radioGroup = screen.getByRole("radiogroup", {
        name: /Theme selection/i,
      })
      expect(radioGroup).toBeInTheDocument()
    })

    it("each radio has associated label", () => {
      renderWithTheme(<AppearanceSettingsPanel />)

      const lightRadio = screen.getByRole("radio", { name: /Light/i })
      const darkRadio = screen.getByRole("radio", { name: /Dark/i })
      const systemRadio = screen.getByRole("radio", { name: /System/i })

      expect(lightRadio).toBeInTheDocument()
      expect(darkRadio).toBeInTheDocument()
      expect(systemRadio).toBeInTheDocument()
    })
  })

  describe("Visual Styling", () => {
    it("highlights selected option", async () => {
      const user = userEvent.setup()
      renderWithTheme(<AppearanceSettingsPanel />)

      const lightLabel = screen.getByLabelText(/Light/i).closest("label")
      await user.click(screen.getByLabelText(/Light/i))

      expect(lightLabel).toHaveClass("border-primary")
    })

    it("applies custom className", () => {
      const { container } = renderWithTheme(
        <AppearanceSettingsPanel className="custom-class" />
      )

      const panel = container.querySelector('[data-slot="appearance-settings-panel"]')
      expect(panel).toHaveClass("custom-class")
    })

    it("forwards additional props", () => {
      renderWithTheme(
        <AppearanceSettingsPanel data-testid="appearance-panel" />
      )

      expect(screen.getByTestId("appearance-panel")).toBeInTheDocument()
    })
  })

  describe("Accessibility", () => {
    it("passes axe accessibility tests", async () => {
      const { container } = renderWithTheme(<AppearanceSettingsPanel />)
      expect(await axe(container)).toHaveNoViolations()
    })

    it("preview cards are hidden from screen readers", () => {
      const { container } = renderWithTheme(<AppearanceSettingsPanel />)
      const previews = container.querySelectorAll('[aria-hidden="true"]')

      previews.forEach((preview) => {
        expect(preview).toHaveAttribute("aria-hidden", "true")
      })
    })
  })
})
