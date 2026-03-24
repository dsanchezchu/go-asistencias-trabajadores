package utils

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
)

type PublicHoliday struct {
	Date        string   `json:"date"`
	LocalName   string   `json:"localName"`
	Name        string   `json:"name"`
	CountryCode string   `json:"countryCode"`
	Fixed       bool     `json:"fixed"`
	Global      bool     `json:"global"`
	Types       []string `json:"types"`
}

var (
	holidayCache = make(map[int][]PublicHoliday)
	cacheMutex   sync.RWMutex
)

// GetHolidays retrieves public holidays for Peru for a given year
func GetHolidays(year int) ([]PublicHoliday, error) {
	cacheMutex.RLock()
	holidays, exists := holidayCache[year]
	cacheMutex.RUnlock()

	if exists {
		return holidays, nil
	}

	url := fmt.Sprintf("https://date.nager.at/api/v3/PublicHolidays/%d/PE", year)
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to fetch holidays: status %d", resp.StatusCode)
	}

	var fetchedHolidays []PublicHoliday
	if err := json.NewDecoder(resp.Body).Decode(&fetchedHolidays); err != nil {
		return nil, err
	}

	cacheMutex.Lock()
	holidayCache[year] = fetchedHolidays
	cacheMutex.Unlock()

	return fetchedHolidays, nil
}

// IsHoliday checks if a specific date is a public holiday in Peru
func IsHoliday(t time.Time) (bool, string) {
	holidays, err := GetHolidays(t.Year())
	if err != nil {
		return false, ""
	}

	dateStr := t.Format("2006-01-02")
	for _, h := range holidays {
		if h.Date == dateStr {
			return true, h.LocalName
		}
	}

	return false, ""
}
