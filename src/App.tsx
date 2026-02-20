import Button from './components/Button';
import Field from './components/InputField';

function App() {
  return (
    <>
      <Button
        mode="blue"
        onClick={async () => {
          await new Promise((r) => setTimeout(r, 2000));
        }}
      >
        Sync Payroll
      </Button>
      <Field label="Employee ID" placeholder="Enter employee ID" />
    </>
  );
}

export default App;
