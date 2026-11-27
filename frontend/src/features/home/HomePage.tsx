import { useRef, useState } from 'react';
import type { ChangeEvent, ClipboardEvent, FormEvent, KeyboardEvent, ReactNode } from 'react';
import RotatingText from '../../components/RotatingText';

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const USER_RE = /^[A-Za-z0-9_]{3,20}$/;
const MODES = ['login', 'signup', 'forgot', 'code', 'reset'] as const;
type Mode = (typeof MODES)[number];
// Supabase's recovery OTP is 6 digits.
const CODE_LEN = 6;
const EMPTY_CODE = Array<string>(CODE_LEN).fill('');

const emailError = (v: string) =>
  !v ? 'Enter your email.' : !EMAIL_RE.test(v) ? 'That doesn’t look like an email.' : '';

const FIELD =
  'h-12 w-full rounded-[10px] border bg-[#161212] text-[15px] text-white outline-none ' +
  'placeholder:text-[#6F6868] transition-[border-color,box-shadow] duration-150 ' +
  // #FF717138 == rgba(255,113,113,0.22); Tailwind's scanner drops arbitrary values containing rgba() commas.
  'focus:border-[#FF7171] focus:shadow-[0_0_0_3px_#FF717138]';

const border = (bad: boolean) => (bad ? 'border-[#FF8A8A]' : 'border-[#2E2828]');
const BTN =
  'mt-1.5 h-12 cursor-pointer rounded-[10px] bg-[#FF7171] text-[15px] font-bold text-[#1A0B0B] ' +
  'transition-colors duration-150 hover:bg-[#FF8585] active:bg-[#F06262] disabled:cursor-default';
const LINK = 'cursor-pointer text-[#FF7171] hover:text-[#FF9A9A] hover:underline';
const BACK =
  'mb-1 -ml-1.5 flex h-8 cursor-pointer items-center self-start rounded-md pl-1.5 pr-2.5 ' +
  'text-[13px] font-semibold text-[#A39C9C] hover:bg-white/6 hover:text-white';
const TOGGLE =
  'absolute right-1.5 top-1.5 h-9 cursor-pointer rounded-md px-2.5 text-[13px] font-semibold ' +
  'text-[#A39C9C] hover:bg-white/6 hover:text-white';
const LABEL = 'text-[13px] font-semibold text-[#D6D0D0]';

function Header({ title, sub }: { title: string; sub: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h2 className="text-[30px] font-bold tracking-[-0.01em]">{title}</h2>
      <p className="ra-pretty text-[15px] text-[#A39C9C]">{sub}</p>
    </div>
  );
}

function Note({ msg, bad }: { msg: string; bad: boolean }) {
  if (!msg) return null;
  return <span className={`text-[13px] ${bad ? 'text-[#FF8A8A]' : 'text-[#8A8383]'}`}>{msg}</span>;
}

// m-auto, not items-center: auto margins centre a short form but collapse to 0 when it
// overflows, so it spills downward only and the pane can actually scroll to the button.
// items-center would push it past both edges with scrollHeight never growing.
function Pane({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <div
      inert={!active}
      className={`w-1/5 overflow-y-auto overflow-x-hidden transition-opacity duration-400 ${active ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="flex min-h-full px-6 py-8">
        <div className="m-auto w-full max-w-85">{children}</div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [mode, setMode] = useState<Mode>('login');

  // login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [tried, setTried] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // signup
  const [suUser, setSuUser] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPw, setSuPw] = useState('');
  const [suPw2, setSuPw2] = useState('');
  const [suShow, setSuShow] = useState(false);
  const [suTried, setSuTried] = useState(false);
  const [suLoading, setSuLoading] = useState(false);
  const [suError, setSuError] = useState('');

  // forgot / code
  const [fpEmail, setFpEmail] = useState('');
  const [fpTried, setFpTried] = useState(false);
  const [code, setCode] = useState<string[]>(EMPTY_CODE);
  const [codeTried, setCodeTried] = useState(false);
  const [resent, setResent] = useState(false);
  const boxes = useRef<Array<HTMLInputElement | null>>([]);

  // reset
  const [rpPw, setRpPw] = useState('');
  const [rpPw2, setRpPw2] = useState('');
  const [rpShow, setRpShow] = useState(false);
  const [rpTried, setRpTried] = useState(false);
  const [rpDone, setRpDone] = useState(false);

  const idx = MODES.indexOf(mode);
  const go = (m: Mode) => {
    setFormError('');
    setSuError('');
    setMode(m);
  };
  const focusBox = (i: number) => {
    const el = boxes.current[i];
    if (el) {
      el.focus();
      el.select();
    }
  };

  // ---- login ----
  const lErr = { email: emailError(email), pw: !password ? 'Enter your password.' : '' };
  const lBad = (k: keyof typeof lErr) => (tried ? lErr[k] : '');

  async function submitLogin(e: FormEvent) {
    e.preventDefault();
    setTried(true);
    setFormError('');
    if (lErr.email || lErr.pw) return;
    setLoading(true);
    // TODO: supabase.auth.signInWithPassword({ email, password })
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    setFormError('Sign-in is not connected yet.');
  }

  // ---- signup ----
  const sErr = {
    user: !suUser
      ? 'Pick a username.'
      : !USER_RE.test(suUser)
        ? '3–20 characters: letters, numbers or _.'
        : '',
    email: emailError(suEmail),
    pw: suPw.length < 8 ? 'Use at least 8 characters.' : '',
    pw2: !suPw2 ? 'Repeat your password.' : suPw2 !== suPw ? 'Passwords don’t match.' : ''
  };
  const sBad = (k: keyof typeof sErr) => (suTried ? sErr[k] : '');

  async function submitSignup(e: FormEvent) {
    e.preventDefault();
    setSuTried(true);
    setSuError('');
    if (sErr.user || sErr.email || sErr.pw || sErr.pw2) return;
    setSuLoading(true);
    // TODO: supabase.auth.signUp({ email, password, options: { data: { username } } }) + uniqueness check
    await new Promise(r => setTimeout(r, 600));
    setSuLoading(false);
    setSuError('Sign-up is not connected yet.');
  }

  // ---- forgot ----
  const fpErr = emailError(fpEmail);
  function submitForgot(e: FormEvent) {
    e.preventDefault();
    setFpTried(true);
    if (fpErr) return;
    // TODO: supabase.auth.resetPasswordForEmail(fpEmail) — verifyOtp below expects this same length.
    setCode(EMPTY_CODE);
    setCodeTried(false);
    setResent(false);
    setMode('code');
    setTimeout(() => focusBox(0), 560);
  }

  // ---- code ----
  const filled = code.every(Boolean);
  const codeErr = codeTried && !filled ? `Enter all ${CODE_LEN} digits.` : '';

  function submitCode(e: FormEvent) {
    e.preventDefault();
    setCodeTried(true);
    if (!filled) return;
    // TODO: supabase.auth.verifyOtp({ email: fpEmail, token: code.join(''), type: 'recovery' })
    setRpPw('');
    setRpPw2('');
    setRpTried(false);
    setRpDone(false);
    setMode('reset');
  }
  function onBoxChange(i: number, e: ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[i] = v;
    setCode(next);
    if (v && i < CODE_LEN - 1) focusBox(i + 1);
  }
  function onBoxKey(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      const next = [...code];
      next[i - 1] = '';
      setCode(next);
      focusBox(i - 1);
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && i > 0) {
      focusBox(i - 1);
      e.preventDefault();
    } else if (e.key === 'ArrowRight' && i < CODE_LEN - 1) {
      focusBox(i + 1);
      e.preventDefault();
    }
  }
  function onBoxPaste(e: ClipboardEvent<HTMLInputElement>) {
    const digits = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, CODE_LEN).split('');
    if (!digits.length) return;
    e.preventDefault();
    setCode(EMPTY_CODE.map((_, k) => digits[k] || ''));
    focusBox(Math.min(digits.length, CODE_LEN - 1));
  }

  // ---- reset ----
  const rErr = {
    pw: rpPw.length < 8 ? 'Use at least 8 characters.' : '',
    pw2: !rpPw2 ? 'Repeat your new password.' : rpPw2 !== rpPw ? 'Passwords don’t match.' : ''
  };
  const rBad = (k: keyof typeof rErr) => (rpTried ? rErr[k] : '');

  function submitReset(e: FormEvent) {
    e.preventDefault();
    setRpTried(true);
    if (rErr.pw || rErr.pw2) return;
    // TODO: supabase.auth.updateUser({ password: rpPw })
    setRpDone(true);
    setTimeout(() => {
      setEmail(fpEmail || email);
      setPassword('');
      setTried(false);
      setMode('login');
    }, 1200);
  }

  return (
    <div className="grid h-full w-full grid-cols-3">
      {/* Chrome autofill repaints inputs, and text-wrap has no Tailwind utility; both need real CSS. */}
      <style>{`
        .ra-field:-webkit-autofill,
        .ra-field:-webkit-autofill:hover,
        .ra-field:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 40px #161212 inset;
          -webkit-text-fill-color: #fff;
        }
        .ra-pretty { text-wrap: pretty; }
      `}</style>

      {/*Logo side */}
      <div className="@container col-span-2 min-w-0 overflow-hidden flex items-center justify-start gap-[5cqi] p-[7.5cqi]">

        <img
          className="max-w-1/3 shrink-0"
          src="/Logo/Logo%20Square/SVG/Logo%20Square_512px.svg"
          alt="RateAnything logo"
        />

        <div className="flex min-w-0 items-center gap-7.5 text-[8cqi] font-bold text-white">
          Rate

          <RotatingText
            texts={['Games', 'Movies', 'Books', 'Anything!']}
            rotationInterval={2000}
            loop={false}
          />
        </div>

      </div>

      {/* Auth panel */}
      <div className="relative min-w-0 overflow-hidden border-l border-white/8 bg-[#0B0909]/72 font-['Segoe_UI',system-ui,sans-serif] text-white backdrop-blur-[14px]">
        <div
          className="flex h-full w-[500%] transition-transform duration-550 ease-[cubic-bezier(.65,0,.25,1)]"
          style={{ transform: `translateX(-${idx * 20}%)` }}
        >

          {/* 0 · Log in */}
          <Pane active={idx === 0}>
            <form noValidate onSubmit={submitLogin} className="flex w-full flex-col gap-5.5">
              <div className="mb-2">
                <Header title="Log in" sub="Pick up your shelf where you left it." />
              </div>

              <label className="flex flex-col gap-2">
                <span className={LABEL}>Email</span>
                <input
                  type="email" autoComplete="email" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  aria-invalid={!!lBad('email')}
                  className={`ra-field px-3.5 ${FIELD} ${border(!!lBad('email'))}`}
                />
                <Note msg={lBad('email')} bad />
              </label>

              <label className="flex flex-col gap-2">
                <span className="flex items-baseline justify-between">
                  <span className={LABEL}>Password</span>
                  <button type="button" onClick={() => go('forgot')} className={`text-[13px] ${LINK}`}>
                    Forgot password?
                  </button>
                </span>
                <span className="relative flex">
                  <input
                    type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)}
                    aria-invalid={!!lBad('pw')}
                    className={`ra-field pl-3.5 pr-16 ${FIELD} ${border(!!lBad('pw'))}`}
                  />
                  <button type="button" onClick={() => setShow(v => !v)} className={TOGGLE}>
                    {show ? 'Hide' : 'Show'}
                  </button>
                </span>
                <Note msg={lBad('pw')} bad />
              </label>

              <Note msg={formError} bad />

              <button type="submit" disabled={loading} className={BTN}>
                {loading ? 'Logging in…' : 'Log in'}
              </button>

              <p className="text-center text-[14px] text-[#A39C9C]">
                New here?{' '}
                <button type="button" onClick={() => go('signup')} className={`font-semibold ${LINK}`}>
                  Create an account
                </button>
              </p>
            </form>
          </Pane>

          {/* 1 · Sign up */}
          <Pane active={idx === 1}>
            <form noValidate onSubmit={submitSignup} className="flex w-full flex-col gap-4.5">
              <button type="button" onClick={() => go('login')} className={BACK}>← Back to log in</button>
              <div className="mb-1.5">
                <Header title="Create your account" sub="One shelf for everything you play, watch and read." />
              </div>

              <label className="flex flex-col gap-2">
                <span className={LABEL}>Username</span>
                <input
                  autoComplete="username" placeholder="shelfkeeper"
                  value={suUser} onChange={e => setSuUser(e.target.value)}
                  aria-invalid={!!sBad('user')}
                  className={`ra-field px-3.5 ${FIELD} ${border(!!sBad('user'))}`}
                />
                <Note msg={sBad('user') || 'Shown on your public profile.'} bad={!!sBad('user')} />
              </label>

              <label className="flex flex-col gap-2">
                <span className={LABEL}>Email</span>
                <input
                  type="email" autoComplete="email" placeholder="you@example.com"
                  value={suEmail} onChange={e => setSuEmail(e.target.value)}
                  aria-invalid={!!sBad('email')}
                  className={`ra-field px-3.5 ${FIELD} ${border(!!sBad('email'))}`}
                />
                <Note msg={sBad('email')} bad />
              </label>

              <label className="flex flex-col gap-2">
                <span className={LABEL}>Password</span>
                <span className="relative flex">
                  <input
                    type={suShow ? 'text' : 'password'} autoComplete="new-password" placeholder="••••••••"
                    value={suPw} onChange={e => setSuPw(e.target.value)}
                    aria-invalid={!!sBad('pw')}
                    className={`ra-field pl-3.5 pr-16 ${FIELD} ${border(!!sBad('pw'))}`}
                  />
                  <button type="button" onClick={() => setSuShow(v => !v)} className={TOGGLE}>
                    {suShow ? 'Hide' : 'Show'}
                  </button>
                </span>
                <Note msg={sBad('pw') || 'At least 8 characters.'} bad={!!sBad('pw')} />
              </label>

              <label className="flex flex-col gap-2">
                <span className={LABEL}>Confirm password</span>
                <input
                  type={suShow ? 'text' : 'password'} autoComplete="new-password" placeholder="••••••••"
                  value={suPw2} onChange={e => setSuPw2(e.target.value)}
                  aria-invalid={!!sBad('pw2')}
                  className={`ra-field px-3.5 ${FIELD} ${border(!!sBad('pw2'))}`}
                />
                <Note msg={sBad('pw2')} bad />
              </label>

              <Note msg={suError} bad />

              <button type="submit" disabled={suLoading} className={BTN}>
                {suLoading ? 'Creating account…' : 'Create account'}
              </button>

              <p className="text-center text-[14px] text-[#A39C9C]">
                Already have an account?{' '}
                <button type="button" onClick={() => go('login')} className={`font-semibold ${LINK}`}>
                  Log in
                </button>
              </p>
            </form>
          </Pane>

          {/* 2 · Forgot password */}
          <Pane active={idx === 2}>
            <form noValidate onSubmit={submitForgot} className="flex w-full flex-col gap-5.5">
              <button type="button" onClick={() => go('login')} className={BACK}>← Back to log in</button>
              <div className="mb-2">
                <Header
                  title="Forgot password"
                  sub={`Enter the email on your account and we’ll send you a ${CODE_LEN}-digit code.`}
                />
              </div>

              <label className="flex flex-col gap-2">
                <span className={LABEL}>Email</span>
                <input
                  type="email" autoComplete="email" placeholder="you@example.com"
                  value={fpEmail}
                  onFocus={() => !fpEmail && email && setFpEmail(email)}
                  onChange={e => setFpEmail(e.target.value)}
                  aria-invalid={!!(fpTried && fpErr)}
                  className={`ra-field px-3.5 ${FIELD} ${border(!!(fpTried && fpErr))}`}
                />
                <Note msg={fpTried ? fpErr : ''} bad />
              </label>

              <button type="submit" className={BTN}>Send code</button>
            </form>
          </Pane>

          {/* 3 · Code sent */}
          <Pane active={idx === 3}>
            <form noValidate onSubmit={submitCode} className="flex w-full flex-col gap-5.5">
              <button type="button" onClick={() => go('forgot')} className={BACK}>← Use a different email</button>
              <div className="mb-2">
                <Header
                  title="Code sent"
                  sub={<>We sent a {CODE_LEN}-digit code to <strong className="font-semibold text-white">{fpEmail}</strong>. Enter it below.</>}
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className={LABEL}>Verification code</span>
                <div className="flex gap-2.5">
                  {code.map((d, i) => (
                    <input
                      key={i}
                      ref={el => { boxes.current[i] = el; }}
                      value={d}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={1}
                      aria-label={`Digit ${i + 1}`}
                      onFocus={e => e.target.select()}
                      onChange={e => onBoxChange(i, e)}
                      onKeyDown={e => onBoxKey(i, e)}
                      onPaste={onBoxPaste}
                      className={`h-16 min-w-0 flex-1 rounded-[10px] border bg-[#161212] text-center text-[26px] font-bold text-white caret-[#FF7171] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#FF7171] focus:shadow-[0_0_0_3px_#FF717138] ${
                        codeErr && !d ? 'border-[#FF8A8A]' : d ? 'border-[#5A4646]' : 'border-[#2E2828]'
                      }`}
                    />
                  ))}
                </div>
                <Note msg={codeErr} bad />
              </div>

              <button type="submit" className={BTN}>Reset password</button>

              <p className="text-center text-[14px] text-[#A39C9C]">
                Didn’t get it?{' '}
                <button type="button" onClick={() => setResent(true)} className={`font-semibold ${LINK}`}>
                  {resent ? 'Sent again ✓' : 'Resend code'}
                </button>
              </p>
            </form>
          </Pane>

          {/* 4 · Set a new password */}
          <Pane active={idx === 4}>
            <form noValidate onSubmit={submitReset} className="flex w-full flex-col gap-5.5">
              <div className="mb-2">
                <Header title="Set a new password" sub="Choose something you haven’t used here before." />
              </div>

              <label className="flex flex-col gap-2">
                <span className={LABEL}>New password</span>
                <span className="relative flex">
                  <input
                    type={rpShow ? 'text' : 'password'} autoComplete="new-password" placeholder="••••••••"
                    value={rpPw} onChange={e => setRpPw(e.target.value)}
                    aria-invalid={!!rBad('pw')}
                    className={`ra-field pl-3.5 pr-16 ${FIELD} ${border(!!rBad('pw'))}`}
                  />
                  <button type="button" onClick={() => setRpShow(v => !v)} className={TOGGLE}>
                    {rpShow ? 'Hide' : 'Show'}
                  </button>
                </span>
                <Note msg={rBad('pw') || 'At least 8 characters.'} bad={!!rBad('pw')} />
              </label>

              <label className="flex flex-col gap-2">
                <span className={LABEL}>Confirm new password</span>
                <input
                  type={rpShow ? 'text' : 'password'} autoComplete="new-password" placeholder="••••••••"
                  value={rpPw2} onChange={e => setRpPw2(e.target.value)}
                  aria-invalid={!!rBad('pw2')}
                  className={`ra-field px-3.5 ${FIELD} ${border(!!rBad('pw2'))}`}
                />
                <Note msg={rBad('pw2')} bad />
              </label>

              <button type="submit" className={BTN}>
                {rpDone ? 'Password updated ✓' : 'Save new password'}
              </button>
            </form>
          </Pane>

        </div>
      </div>

    </div>
  );
}
