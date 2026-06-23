import { useReducer } from "react";

interface CalendarState {
  year: number;
  month: number;
  selectedDate: Date | null;
  slideDir: "left" | "right";
  slideKey: number;
}

type CalendarAction =
  | { type: "MOVE_MONTH"; delta: number }
  | { type: "SELECT_DATE"; date: Date };

function calendarReducer(state: CalendarState, action: CalendarAction): CalendarState {
  switch (action.type) {
    case "MOVE_MONTH": {
      let month = state.month + action.delta;
      let year = state.year;
      if (month > 11) { month = 0; year++; }
      if (month < 0) { month = 11; year--; }
      return {
        ...state,
        year,
        month,
        selectedDate: null,
        slideDir: action.delta > 0 ? "right" : "left",
        slideKey: state.slideKey + 1,
      };
    }
    case "SELECT_DATE":
      return { ...state, selectedDate: action.date };
    default:
      return state;
  }
}

export function useCalendar() {
  const [state, dispatch] = useReducer(calendarReducer, undefined, (): CalendarState => {
    const today = new Date();
    return {
      year: today.getFullYear(),
      month: today.getMonth(),
      selectedDate: null,
      slideDir: "right",
      slideKey: 0,
    };
  });

  return {
    ...state,
    moveMonth: (delta: number) => dispatch({ type: "MOVE_MONTH", delta }),
    selectDate: (date: Date) => dispatch({ type: "SELECT_DATE", date }),
  };
}
