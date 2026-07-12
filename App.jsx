import MeetingScheduler from './MeetingScheduler';
import './App.css';

function App() {
  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'stretch', justifyContent: 'stretch', background: '#F0EEE7', padding: '24px 32px', boxSizing: 'border-box' }}>
      <MeetingScheduler />
    </div>
  );
}

export default App;
