import { BlueDot } from "./blue-dot";
import { orderedTechItems } from "../lib/tech";
import { CFImage } from "./cf-image";
import { BulletPoint, SectionHeader, SmallLink } from "./legacy";

export function BioSection() {
  return (
    <div>
      <h1 className="text-xl font-medium">luke stephens</h1>
      <h2 className="text-neutral-500">
        an individual, type-4 enneagram, passionate, dedicated, resilient.
      </h2>
    </div>
  );
}

export function SocialSection() {
  return (
    <div>
      <SectionHeader title="social" />
      <div className="flex flex-col">
        <SmallLink href="https://www.thecrag.com/climber/luke6" label="thecrag.com" external />
        <SmallLink href="https://twitter.com/lukey_stephens" label="twitter.com" external />
        <SmallLink href="https://layers.to/lukey" label="layers.to" external />
        <SmallLink href="https://github.com/imprisonedmind" label="github.com" external />
      </div>
    </div>
  );
}

export function EmploymentSection() {
  return (
    <div>
      <SectionHeader title="employment" />
      <div className="flex flex-col">
        <p className="text-sm text-neutral-500">Trinity Telecomms (PTY) LTD</p>
        <BulletPoint title="design and research lead" date="'23-current" />
        <BulletPoint title="software designer" date="'21-current" />
      </div>
      <div className="flex flex-col">
        <p className="text-sm text-neutral-500">Specno</p>
        <BulletPoint title="multimedia designer" date="'19-20" />
      </div>
    </div>
  );
}

export function EducationSection() {
  return (
    <div>
      <SectionHeader title="education" />
      <div className="flex flex-col">
        <p className="text-sm text-neutral-500">BA Visual Communications Degree</p>
        <BulletPoint title="major in multimedia" date="'18-20" />
      </div>
    </div>
  );
}

export function LocationSection() {
  return (
    <div className="flex w-full flex-col gap-1">
      <SectionHeader title="location" />
      <div className="flex w-full flex-col gap-2 rounded-xl bg-white p-2 shadow-sm">
        <div className="relative h-72 w-full overflow-hidden rounded-lg">
          <BlueDot />
          <CFImage
            className="h-full w-full scale-[1.2] object-cover"
            src="/images/location/map.png"
            alt="Cape Town map"
            preset="locationMap"
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm lowercase text-neutral-800">Cape Town</p>
          <div className="flex rounded-full bg-neutral-100 p-1 px-2 text-xs">
            <span>-33.93,</span>
            <span>18.47</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TechSection() {
  const marqueeItems = [...orderedTechItems, ...orderedTechItems];

  return (
    <div className="px-4 md:px-0">
      <SectionHeader
        title="tech"
        action={<SmallLink href="/tech" label="more" ariaLabel="More tech" srSuffix=" tech" />}
      />
      <div className="tech-marquee relative overflow-hidden py-4">
        <div className="tech-marquee-track flex w-max items-center gap-4 px-4">
          {marqueeItems.map((item, index) => (
            <a
              key={`${item.label}-${index}`}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="flex h-14 min-w-[96px] items-center justify-center px-1 transition duration-150 ease-in-out hover:opacity-75"
              aria-label={item.label}
              title={item.label}
            >
              <CFImage
                src={item.src}
                alt={item.label}
                className="h-10 w-auto max-w-[104px] object-contain"
                preset="techLogo"
              />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
