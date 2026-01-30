type PatientHeaderData = {
  patientIdNum: string;
  fullName: string;
  dob: string; // dd/mm/yyyy
  age: number;
  sex: string;
  requestingPhysician: string;
};

type Props = {
  title: string; // HEMATOLOGY, CLINICAL CHEMISTRY, etc.
  subtitle?: string; // CBC, OGTT, etc.
  patient: PatientHeaderData;
  children: React.ReactNode; // form-specific body
};

export default function FormLayout({
  title,
  subtitle,
  patient,
  children,
}: Props) {
  return (
    <div className="a4-page">
      <header className="header">
        <div className="logo">LOGO</div>
        <div className="lab-info">
          <div className="lab-name">Your Clinical Laboratory</div>
          <div className="lab-sub">Address · Contact</div>
        </div>
        <div className="meta">
          <div>Printed: {new Date().toLocaleDateString()}</div>
        </div>
      </header>

      <section className="patient-box">
        <div>
          <b>ID:</b> {patient.patientIdNum}
        </div>
        <div>
          <b>Name:</b> {patient.fullName}
        </div>
        <div>
          <b>DOB:</b> {patient.dob}
        </div>
        <div>
          <b>Age:</b> {patient.age}
        </div>
        <div>
          <b>Sex:</b> {patient.sex}
        </div>
        <div>
          <b>Physician:</b> {patient.requestingPhysician}
        </div>
      </section>

      <section className="title">
        <h1>{title}</h1>
        {subtitle && <h2>{subtitle}</h2>}
      </section>

      <main className="body">{children}</main>

      <footer className="footer">
        <div>Performed by: ____________</div>
        <div>Verified by: ____________</div>
      </footer>
    </div>
  );
}
