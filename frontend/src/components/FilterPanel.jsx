import DatePicker from 'react-datepicker';

const AGE_OPTIONS   = ['All', '<18', '18-40', '>40'];
const GENDER_OPTIONS = ['All', 'Male', 'Female', 'Other'];

export default function FilterPanel({ filters, onChange }) {
  return (
    <>
      {/* Date range */}
      <div className="filter-group date-group">
        <label className="label" htmlFor="filter-start-date">Start Date</label>
        <DatePicker
          id="filter-start-date"
          selected={filters.startDate}
          onChange={(date) => onChange('startDate', date)}
          selectsStart
          startDate={filters.startDate}
          endDate={filters.endDate}
          dateFormat="MMM d, yyyy"
          placeholderText="Start date"
          maxDate={filters.endDate}
        />
      </div>

      <div className="filter-group date-group">
        <label className="label" htmlFor="filter-end-date">End Date</label>
        <DatePicker
          id="filter-end-date"
          selected={filters.endDate}
          onChange={(date) => onChange('endDate', date)}
          selectsEnd
          startDate={filters.startDate}
          endDate={filters.endDate}
          dateFormat="MMM d, yyyy"
          placeholderText="End date"
          minDate={filters.startDate}
          maxDate={new Date()}
        />
      </div>

      {/* Age */}
      <div className="filter-group">
        <label className="label" htmlFor="filter-age">Age Group</label>
        <select
          id="filter-age"
          className="select"
          value={filters.age}
          onChange={(e) => onChange('age', e.target.value)}
        >
          {AGE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt === 'All' ? 'All Ages' : opt}</option>
          ))}
        </select>
      </div>

      {/* Gender */}
      <div className="filter-group">
        <label className="label" htmlFor="filter-gender">Gender</label>
        <select
          id="filter-gender"
          className="select"
          value={filters.gender}
          onChange={(e) => onChange('gender', e.target.value)}
        >
          {GENDER_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt === 'All' ? 'All Genders' : opt}</option>
          ))}
        </select>
      </div>
    </>
  );
}
