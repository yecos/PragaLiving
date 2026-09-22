"use client";

import styles from "./brochure.module.css";

const amenityCards = [
  { n: "01", title: "Coworking", text: "Trabajo flexible, salas de reunión y luz natural.", image: "/images/amenities-2026/coworking-02.jpg" },
  { n: "02", title: "Gimnasio", text: "Un espacio pensado para integrar movimiento y bienestar a la rutina.", image: "/images/amenities-2026/gimnasio-01.jpg" },
  { n: "03", title: "Salón social", text: "Encuentros, celebración y arquitectura cálida en un mismo lugar.", image: "/images/amenities-2026/salon-social-01.jpg" },
  { n: "04", title: "Vitality Pool", text: "Una pausa sensorial para recuperar energía sin salir de casa.", image: "/images/amenities-2026/vitality-pool-01.jpg" }
];

const typologies = [
  { area: "104 m²", meta: "3 hab · 2 baños", image: "/images/typologies/104-01.jpg" },
  { area: "78.51 m²", meta: "3 hab · 2 baños", image: "/images/typologies/78-01.jpg" },
  { area: "60 m²", meta: "2 hab · 1 baño", image: "/images/typologies/60-01.jpg" },
  { area: "33–36 m²", meta: "1 hab · 1 baño", image: "/images/typologies/33-01.jpg" }
];

function PageNumber({ n }: { n: string }) {
  return <span className={styles.pageNumber}>{n}</span>;
}

export default function BrochurePage() {
  return (
    <main className={styles.shell}>
      <div className={styles.toolbar}>
        <div>
          <strong>PRAGA Living</strong>
          <span>Brochure comercial · formato horizontal</span>
        </div>
        <button onClick={() => window.print()}>Imprimir / Guardar PDF</button>
      </div>

      <article className={styles.book}>
        <section className={[styles.page, styles.cover].join(" ")}>
          <img src="/images/renders/hero-sunset.jpg" alt="PRAGA Living al atardecer" className={styles.coverImage} />
          <div className={styles.coverShade} />
          <div className={styles.coverTop}>RESIDENCIAS PREMIUM · CALDAS, ANTIOQUIA</div>
          <div className={styles.coverTitle}>
            <span>PRAGA</span>
            <span>LIVING</span>
          </div>
          <div className={styles.coverBottom}>
            <p>Arquitectura para quienes valoran lo excepcional.</p>
            <div className={styles.coverRule} />
            <p>Una pieza diseñada para permanecer.</p>
          </div>
          <PageNumber n="01" />
        </section>

        <section className={[styles.page, styles.lightPage].join(" ")}>
          <PageNumber n="02" />
          <div className={styles.manifestoGrid}>
            <div className={styles.kicker}>MANIFIESTO</div>
            <h1>Una pieza arquitectónica<br />diseñada para permanecer.</h1>
            <p className={styles.manifestoText}>
              PRAGA Living propone una forma de habitar donde arquitectura, diseño, bienestar,
              permanencia y naturaleza se convierten en una sola experiencia.
            </p>
            <div className={styles.manifestoWords}>
              <span>ARQUITECTURA</span>
              <span>BIENESTAR</span>
              <span>PERMANENCIA</span>
              <span>EXCLUSIVIDAD</span>
            </div>
            <figure className={styles.manifestoImage}>
              <img src="/images/renders/hero-day.jpg" alt="Fachada de PRAGA Living" />
            </figure>
          </div>
        </section>

        <section className={[styles.page, styles.splitDark].join(" ")}>
          <PageNumber n="03" />
          <div className={styles.splitCopy}>
            <div className={styles.kickerDark}>ARQUITECTURA</div>
            <h2>Donde la arquitectura<br />y la naturaleza se encuentran.</h2>
            <p>
              Fachadas vegetales, balcones ajardinados y un atrio central integran la naturaleza
              a la vida cotidiana. Cada residencia busca maximizar luz natural, ventilación y vistas.
            </p>
            <div className={styles.materialLine}>
              <span>Materia</span><i />
              <span>Luz</span><i />
              <span>Vegetación</span>
            </div>
          </div>
          <img src="/images/renders/exterior-golden.png" alt="Fachada PRAGA Living" className={styles.splitImage} />
        </section>

        <section className={[styles.page, styles.statsPage].join(" ")}>
          <PageNumber n="04" />
          <img src="/images/renders/exterior-dusk.png" alt="Base y fachada de PRAGA Living" className={styles.statsImage} />
          <div className={styles.statsPanel}>
            <div className={styles.kicker}>EL EDIFICIO</div>
            <h2>Una escala íntima.<br />Una experiencia completa.</h2>
            <div className={styles.statList}>
              <div><strong>12</strong><span>Niveles residenciales</span></div>
              <div><strong>8</strong><span>Tipologías</span></div>
              <div><strong>360°</strong><span>Recorridos virtuales</span></div>
            </div>
            <p>Una composición vertical que privilegia la relación entre vivienda, paisaje y espacios compartidos.</p>
          </div>
        </section>

        <section className={[styles.page, styles.atriumPage].join(" ")}>
          <PageNumber n="05" />
          <img src="/images/renders/atrio-2026/atrio-vertical.jpg" alt="Atrio vertical de PRAGA Living" className={styles.atriumTall} />
          <div className={styles.atriumText}>
            <div className={styles.kicker}>EL ATRIO</div>
            <h2>El corazón vivo<br />del proyecto.</h2>
            <p>
              Un vacío vertical bañado por luz natural conecta visualmente los niveles y transforma
              la circulación cotidiana en una experiencia de amplitud, calma y pertenencia.
            </p>
            <div className={styles.verticalRule} />
            <span>Conexión · luz · vegetación · recorrido</span>
          </div>
          <img src="/images/renders/atrio-2026/atrio-niveles.jpg" alt="Niveles del atrio de PRAGA Living" className={styles.atriumWide} />
        </section>

        <section className={[styles.page, styles.arrivalPage].join(" ")}>
          <PageNumber n="06" />
          <div className={styles.arrivalHeader}>
            <div className={styles.kicker}>LA LLEGADA</div>
            <h2>Una bienvenida que anticipa la experiencia.</h2>
            <p>Piedra, madera, iluminación cálida y formas orgánicas marcan la transición entre la ciudad y el hogar.</p>
          </div>
          <div className={styles.arrivalGallery}>
            <figure className={styles.arrivalLarge}><img src="/images/renders/atrio-2026/recepcion-escalera.jpg" alt="Recepción y escalera" /></figure>
            <figure><img src="/images/renders/atrio-2026/recepcion-bienvenida.jpg" alt="Recepción" /></figure>
            <figure><img src="/images/renders/atrio-2026/recepcion-ascensor.jpg" alt="Lobby" /></figure>
          </div>
        </section>

        <section className={[styles.page, styles.amenitiesPage].join(" ")}>
          <PageNumber n="07" />
          <div className={styles.amenitiesHeading}>
            <div className={styles.kicker}>VIVIR PRAGA</div>
            <h2>El lujo está en cómo se vive cada día.</h2>
            <p>Espacios compartidos con lenguaje residencial, iluminación serena y una materialidad coherente con todo el proyecto.</p>
          </div>
          <div className={styles.amenityGrid}>
            {amenityCards.map((item) => (
              <article className={styles.amenityCard} key={item.n}>
                <img src={item.image} alt={item.title} />
                <div>
                  <span>{item.n}</span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={[styles.page, styles.wellnessPage].join(" ")}>
          <PageNumber n="08" />
          <div className={styles.wellnessHero}>
            <img src="/images/amenities-2026/sauna-01.jpg" alt="Sauna PRAGA Living" />
            <div className={styles.wellnessCaption}>
              <span>05</span>
              <h2>Bienestar<br />sin salir de casa.</h2>
            </div>
          </div>
          <div className={styles.wellnessSide}>
            <figure><img src="/images/amenities-2026/ludoteca-01.jpg" alt="Ludoteca PRAGA Living" /></figure>
            <figure><img src="/images/amenities-2026/wellness-ducha-01.jpg" alt="Zona wellness PRAGA Living" /></figure>
            <p>Sauna &amp; turco · ludoteca · zonas de recuperación · espacios para cada ritmo de vida.</p>
          </div>
        </section>

        <section className={[styles.page, styles.residencePage].join(" ")}>
          <PageNumber n="09" />
          <img src="/images/typologies/104-01.jpg" alt="Interior residencia PRAGA Living" className={styles.residenceImage} />
          <div className={styles.residenceCard}>
            <div className={styles.kickerDark}>RESIDENCIAS</div>
            <h2>Interiores serenos.<br />Espacios que respiran.</h2>
            <p>
              Proporciones limpias, tonos cálidos y visuales abiertas construyen una atmósfera
              contemporánea pensada para permanecer vigente en el tiempo.
            </p>
            <div className={styles.signature}>PRAGA LIVING / INTERIOR EXPERIENCE</div>
          </div>
        </section>

        <section className={[styles.page, styles.typologyPage].join(" ")}>
          <PageNumber n="10" />
          <div className={styles.typologyHeader}>
            <div>
              <div className={styles.kicker}>TIPOLOGÍAS</div>
              <h2>Distintas maneras<br />de vivir PRAGA.</h2>
            </div>
            <p>Una selección de configuraciones para diferentes momentos, necesidades y estilos de vida.</p>
          </div>
          <div className={styles.typologyGrid}>
            {typologies.map((t) => (
              <article key={t.area}>
                <img src={t.image} alt={"Tipología " + t.area} />
                <div><h3>{t.area}</h3><span>{t.meta}</span></div>
              </article>
            ))}
          </div>
        </section>

        <section className={[styles.page, styles.interiorPage].join(" ")}>
          <PageNumber n="11" />
          <div className={styles.interiorTitle}>
            <div className={styles.kicker}>INTERIORES</div>
            <h2>Interiores cálidos,<br />contemporáneos y atemporales.</h2>
            <p>
              Cada espacio ha sido pensado para ofrecer amplitud visual, luz natural y una atmósfera serena.
              Tonos neutros, texturas cálidas y una materialidad coherente construyen una experiencia residencial
              sobria, elegante y vigente en el tiempo.
            </p>
          </div>
          <div className={styles.interiorMosaic}>
            <figure className={styles.mosaicA}><img src="/images/typologies/104-02.jpg" alt="Interior PRAGA Living" /></figure>
            <figure className={styles.mosaicB}><img src="/images/typologies/78-04.jpg" alt="Interior PRAGA Living" /></figure>
            <figure className={styles.mosaicC}><img src="/images/typologies/60-03.jpg" alt="Interior PRAGA Living" /></figure>
            <figure className={styles.mosaicD}><img src="/images/typologies/33-02.jpg" alt="Interior PRAGA Living" /></figure>
          </div>
        </section>

        <section className={[styles.page, styles.locationPage].join(" ")}>
          <PageNumber n="12" />
          <div className={styles.locationIntro}>
            <div className={styles.kicker}>UBICACIÓN</div>
            <h2>Caldas, Antioquia.<br />Todo más cerca de tu día a día.</h2>
            <p>
              PRAGA Living se ubica en Calle 133 Sur #49-94, en el tejido urbano consolidado de Caldas.
              Su localización conecta el proyecto con comercio, servicios, educación, salud y los principales
              recorridos del municipio.
            </p>
            <div className={styles.locationAddress}>
              <span>PRAGA LIVING</span>
              <strong>Cl. 133 Sur #49-94 · Caldas, Antioquia</strong>
              <small>6.08895° N · 75.63514° W</small>
            </div>
          </div>

          <div className={styles.streetMap} aria-label="Mapa esquemático de ubicación de PRAGA Living en Caldas">
            <div className={[styles.street, styles.streetVertical, styles.cra45].join(" ")}><span>Cra. 45</span></div>
            <div className={[styles.street, styles.streetVertical, styles.cra48].join(" ")}><span>Cra. 48</span></div>
            <div className={[styles.street, styles.streetVertical, styles.cra49].join(" ")}><span>Cra. 49</span></div>
            <div className={[styles.street, styles.streetVertical, styles.cra50].join(" ")}><span>Cra. 50</span></div>
            <div className={[styles.street, styles.streetVertical, styles.cra51].join(" ")}><span>Cra. 51</span></div>

            <div className={[styles.street, styles.streetHorizontal, styles.cl118].join(" ")}><span>Cl. 118 Sur</span></div>
            <div className={[styles.street, styles.streetHorizontal, styles.cl126].join(" ")}><span>Cl. 126A Sur</span></div>
            <div className={[styles.street, styles.streetHorizontal, styles.cl130].join(" ")}><span>Cl. 130 Sur</span></div>
            <div className={[styles.street, styles.streetHorizontal, styles.cl133].join(" ")}><span>Cl. 133 Sur</span></div>
            <div className={[styles.street, styles.streetHorizontal, styles.cl135].join(" ")}><span>Cl. 135 Sur</span></div>

            <div className={[styles.mapPoi, styles.poiSalle].join(" ")}>
              <i />
              <span>La Salle</span>
              <small>Cra. 51 · Cl. 118 Sur</small>
            </div>
            <div className={[styles.mapPoi, styles.poiMontpellier].join(" ")}>
              <i />
              <span>Montpellier Plaza</span>
              <small>Cl. 126A Sur · Cra. 50</small>
            </div>
            <div className={[styles.mapPoi, styles.poiParque].join(" ")}>
              <i />
              <span>Parque Principal</span>
              <small>Cra. 49 · Cl. 129–130 Sur</small>
            </div>
            <div className={[styles.mapPoi, styles.poiHospital].join(" ")}>
              <i />
              <span>Hospital San Vicente</span>
              <small>Cra. 48 · Cl. 135 Sur</small>
            </div>

            <div className={styles.projectPin}>
              <div className={styles.projectMarker}>P</div>
              <div>
                <strong>PRAGA Living</strong>
                <span>Cl. 133 Sur #49-94</span>
              </div>
            </div>

            <div className={styles.northArrow}><span>N</span><i /></div>
            <div className={styles.metroConnector}>
              <span>Conexión hacia Sabaneta</span>
              <strong>Metro La Estrella ↑</strong>
            </div>
          </div>

          <div className={styles.locationNote}>
            Mapa esquemático de referencia. La posición del proyecto corresponde a la dirección y coordenadas oficiales usadas en el proyecto.
          </div>
        </section>

        <section className={[styles.page, styles.contactPage].join(" ")}>
          <PageNumber n="13" />
          <img src="/images/renders/hero-night.jpg" alt="PRAGA Living de noche" className={styles.contactImage} />
          <div className={styles.contactShade} />
          <div className={styles.contactContent}>
            <div className={styles.kickerDark}>CONOCE PRAGA LIVING</div>
            <h2>Tu próxima residencia<br />puede comenzar aquí.</h2>
            <p>Agenda una conversación privada con nuestro equipo comercial.</p>
            <div className={styles.contactData}>
              <a href="https://wa.me/573004203548">WhatsApp · +57 300 420 3548</a>
              <a href="tel:+573004203548">Llamadas · +57 300 420 3548</a>
              <a href="mailto:urbanovagrupoempresarial@gmail.com">urbanovagrupoempresarial@gmail.com</a>
            </div>
          </div>
        </section>

        <section className={[styles.page, styles.backCover].join(" ")}>
          <PageNumber n="14" />
          <div className={styles.backLogo}>
            <img src="/images/logo.png" alt="PRAGA Living" />
          </div>
          <p>ARQUITECTURA PARA QUIENES VALORAN LO EXCEPCIONAL</p>
          <span>CALDAS · ANTIOQUIA · COLOMBIA</span>
          <div className={styles.backLine} />
          <small>Material comercial. Imágenes de carácter ilustrativo.</small>
        </section>
      </article>
    </main>
  );
}
