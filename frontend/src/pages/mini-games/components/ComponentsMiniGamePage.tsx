import { useState } from 'react';

import {
  RiArticleLine,
  RiBookOpenLine,
  RiBriefcase4Line,
  RiGamepadLine,
  RiMenuLine,
} from '@remixicon/react';

import '@/pages/mini-games/components/components-mini-game.css';
import {
  Article,
  Badge,
  Button,
  Card,
  Category,
  Icon,
  IconButton,
  OverlayBorder,
  ProjectCard,
  SearchBar,
  SearchFilter,
} from '@/shared/ui';

const ComponentsMiniGamePage = (): React.ReactElement => {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('all');

  return (
    <div className="components-lab-page">
      <section className="components-lab-hero">
        <h1>Components Lab</h1>
        <p>
          재사용 가능한 공용 컴포넌트들을 나열하고 동작을 빠르게 테스트합니다.
        </p>
      </section>

      <div className="components-lab-main">
        <div className="components-lab-stack">
          <section className="components-lab-section">
            <h2>Card</h2>
            <div className="components-lab-card-grid">
              <Card
                description="공통 UI 컴포넌트와 디자인 토큰을 정렬합니다."
                title="Architecture"
                icon={
                  <RiBriefcase4Line
                    aria-hidden="true"
                    className="components-lab-card-icon"
                  />
                }
              />
              <Card
                description="도메인 페이지에서 재사용 가능한 검색/필터를 사용합니다."
                title="Search UX"
                icon={
                  <RiArticleLine
                    aria-hidden="true"
                    className="components-lab-card-icon"
                  />
                }
              />
              <Card
                description="컴포넌트별 icon prop으로 아이콘 교체가 가능합니다."
                title="Icon Slot"
                icon={
                  <RiBookOpenLine
                    aria-hidden="true"
                    className="components-lab-card-icon"
                  />
                }
              />
            </div>
          </section>

          <section className="components-lab-section components-lab-section-card-snapshots">
            <h2>Card Snapshots</h2>
            <div className="components-lab-state-grid">
              <article className="components-lab-state-card">
                <h3>Card</h3>
                <div className="components-lab-state-row components-lab-state-row-card">
                  <div className="components-lab-state-item">
                    <span>기본</span>
                    <Card
                      className="components-lab-state-card-preview"
                      description="기본 상태"
                      title="Card"
                      icon={
                        <RiBriefcase4Line
                          aria-hidden="true"
                          className="components-lab-card-icon"
                        />
                      }
                    />
                  </div>
                  <div className="components-lab-state-item">
                    <span>Hover</span>
                    <Card
                      className="components-lab-state-card-preview hover"
                      description="hover 상태"
                      title="Card"
                      icon={
                        <RiBriefcase4Line
                          aria-hidden="true"
                          className="components-lab-card-icon"
                        />
                      }
                    />
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section className="components-lab-section">
            <h2>Badge, Category & Icon</h2>
            <div className="components-lab-inline-wrap">
              <Badge>White</Badge>
              <Badge color="SkyBlue">SkyBlue</Badge>
              <Badge color="LightGray">LightGray</Badge>
              <Badge color="BlueGray">BlueGray</Badge>
              <Badge color="DarkBlue">DarkBlue</Badge>
            </div>
            <div className="components-lab-inline-wrap">
              <Category
                onClick={() => setSelected('all')}
                selected={selected === 'all'}
              >
                All
              </Category>
              <Category
                onClick={() => setSelected('frontend')}
                selected={selected === 'frontend'}
              >
                Frontend
              </Category>
              <Category
                onClick={() => setSelected('backend')}
                selected={selected === 'backend'}
              >
                Backend
              </Category>
              <Icon />
              <Icon
                icon={
                  <RiGamepadLine aria-hidden="true" className="ui-icon-glyph" />
                }
              />
            </div>
          </section>

          <section className="components-lab-section">
            <h2>Category Snapshots</h2>
            <div className="components-lab-state-grid">
              <article className="components-lab-state-card">
                <h3>Category</h3>
                <div className="components-lab-state-row components-lab-state-row-button">
                  <div className="components-lab-state-item">
                    <span>기본</span>
                    <Category>Frontend</Category>
                  </div>
                  <div className="components-lab-state-item">
                    <span>Hover</span>
                    <Category className="components-lab-force-hover">
                      Frontend
                    </Category>
                  </div>
                  <div className="components-lab-state-item">
                    <span>Active</span>
                    <Category className="components-lab-force-active">
                      Frontend
                    </Category>
                  </div>
                  <div className="components-lab-state-item">
                    <span>Disabled</span>
                    <Category disabled>Frontend</Category>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section className="components-lab-section">
            <h2>Buttons & Status</h2>
            <div className="components-lab-inline-wrap">
              <Button color="BlueGray">Primary</Button>
              <Button color="Gray">Secondary</Button>
              <Button color="Dark">Action</Button>
              <Button disabled color="Light">
                Disabled
              </Button>
              <IconButton
                icon={
                  <RiMenuLine aria-hidden="true" className="ui-icon-glyph" />
                }
              />
              <IconButton
                icon={
                  <RiGamepadLine aria-hidden="true" className="ui-icon-glyph" />
                }
              />
            </div>
            <div className="components-lab-inline-wrap">
              <OverlayBorder label="Default" tone="default" />
              <OverlayBorder label="Info" tone="info" />
              <OverlayBorder label="Success" tone="success" />
              <OverlayBorder label="Warning" tone="warning" />
              <OverlayBorder label="Danger" tone="danger" />
            </div>
          </section>

          <section className="components-lab-section components-lab-section-button-snapshots">
            <h2>Button & IconButton Snapshots</h2>
            <div className="components-lab-state-grid">
              <article className="components-lab-state-card">
                <h3>Button</h3>
                <div className="components-lab-state-row components-lab-state-row-button">
                  <div className="components-lab-state-item">
                    <span>기본</span>
                    <Button color="BlueGray">Primary</Button>
                  </div>
                  <div className="components-lab-state-item">
                    <span>Hover</span>
                    <Button
                      className="components-lab-force-hover"
                      color="BlueGray"
                    >
                      Primary
                    </Button>
                  </div>
                  <div className="components-lab-state-item">
                    <span>Active</span>
                    <Button
                      className="components-lab-force-active"
                      color="BlueGray"
                    >
                      Primary
                    </Button>
                  </div>
                  <div className="components-lab-state-item">
                    <span>Disabled</span>
                    <Button disabled color="BlueGray">
                      Primary
                    </Button>
                  </div>
                </div>
              </article>

              <article className="components-lab-state-card">
                <h3>IconButton</h3>
                <div className="components-lab-state-row components-lab-state-row-button">
                  <div className="components-lab-state-item">
                    <span>기본</span>
                    <IconButton
                      icon={
                        <RiMenuLine
                          aria-hidden="true"
                          className="ui-icon-glyph"
                        />
                      }
                    />
                  </div>
                  <div className="components-lab-state-item">
                    <span>Hover</span>
                    <IconButton
                      className="components-lab-force-hover"
                      icon={
                        <RiMenuLine
                          aria-hidden="true"
                          className="ui-icon-glyph"
                        />
                      }
                    />
                  </div>
                  <div className="components-lab-state-item">
                    <span>Active</span>
                    <IconButton
                      className="components-lab-force-active"
                      icon={
                        <RiMenuLine
                          aria-hidden="true"
                          className="ui-icon-glyph"
                        />
                      }
                    />
                  </div>
                  <div className="components-lab-state-item">
                    <span>Disabled</span>
                    <IconButton
                      disabled
                      icon={
                        <RiMenuLine
                          aria-hidden="true"
                          className="ui-icon-glyph"
                        />
                      }
                    />
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section className="components-lab-section">
            <h2>ProjectCard & Article</h2>
            <div className="components-lab-list-stack">
              <ProjectCard
                badges={['UI', 'Test', 'Playground']}
                className="components-lab-project-card-demo"
                description="재사용 가능한 카드 레이아웃과 배지 조합을 테스트합니다."
                mediaAlt="project preview"
                mediaSrc="/vite.svg"
                title="Components Playground"
              />
              <Article
                badges={['Frontend', 'Architecture']}
                date="Feb 25, 2026"
                description="Article 컴포넌트의 date, badge, media, 링크 영역을 한 번에 검증합니다."
                mediaAlt="article preview"
                mediaSrc="/vite.svg"
                mode="Desktop"
                title="Reusable Article Component"
              />
            </div>
          </section>

          <section className="components-lab-section components-lab-section-wide-snapshots">
            <h2>ProjectCard & Article Snapshots</h2>
            <div className="components-lab-state-grid">
              <article className="components-lab-state-card">
                <h3>ProjectCard</h3>
                <div className="components-lab-state-row components-lab-state-row-project">
                  <div className="components-lab-state-item">
                    <span>기본</span>
                    <ProjectCard
                      badges={['UI', 'State']}
                      className="components-lab-state-card-preview"
                      description="기본 상태"
                      mediaAlt="project state"
                      mediaSrc="/vite.svg"
                      title="ProjectCard"
                    />
                  </div>
                  <div className="components-lab-state-item">
                    <span>Hover</span>
                    <ProjectCard
                      badges={['UI', 'State']}
                      className="components-lab-state-card-preview hover"
                      description="hover 상태"
                      mediaAlt="project state"
                      mediaSrc="/vite.svg"
                      title="ProjectCard"
                    />
                  </div>
                  <div className="components-lab-state-item">
                    <span>기본 (이미지 없음)</span>
                    <ProjectCard
                      badges={['UI', 'State']}
                      className="components-lab-state-card-preview"
                      description="이미지 없는 기본 상태"
                      title="ProjectCard"
                    />
                  </div>
                  <div className="components-lab-state-item">
                    <span>Hover (이미지 없음)</span>
                    <ProjectCard
                      badges={['UI', 'State']}
                      className="components-lab-state-card-preview hover"
                      description="이미지 없는 hover 상태"
                      title="ProjectCard"
                    />
                  </div>
                </div>
              </article>

              <article className="components-lab-state-card">
                <h3>Article</h3>
                <div className="components-lab-state-row components-lab-state-row-article">
                  <div className="components-lab-state-item">
                    <span>기본</span>
                    <Article
                      badges={['Frontend']}
                      className="components-lab-state-card-preview"
                      date="Feb 25, 2026"
                      description="기본 상태"
                      mediaAlt="article state"
                      mediaSrc="/vite.svg"
                      mode="Desktop"
                      title="Article"
                    />
                  </div>
                  <div className="components-lab-state-item">
                    <span>Hover</span>
                    <Article
                      badges={['Frontend']}
                      className="components-lab-state-card-preview hover"
                      date="Feb 25, 2026"
                      description="hover 상태"
                      mediaAlt="article state"
                      mediaSrc="/vite.svg"
                      mode="Desktop"
                      title="Article"
                    />
                  </div>
                  <div className="components-lab-state-item">
                    <span>기본 (이미지 없음)</span>
                    <Article
                      badges={['Frontend']}
                      className="components-lab-state-card-preview components-lab-article-preview"
                      date="Feb 25, 2026"
                      description="이미지 없는 기본 상태"
                      mode="Desktop"
                      title="Article"
                    />
                  </div>
                  <div className="components-lab-state-item">
                    <span>Hover (이미지 없음)</span>
                    <Article
                      badges={['Frontend']}
                      className="components-lab-state-card-preview components-lab-article-preview hover"
                      date="Feb 25, 2026"
                      description="이미지 없는 hover 상태"
                      mode="Desktop"
                      title="Article"
                    />
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section className="components-lab-section">
            <h2>Search Components</h2>
            <SearchBar
              onChange={(event) => setQuery(event.target.value)}
              value={query}
            />
            <SearchFilter
              mode="Desktop"
              onQueryChange={setQuery}
              onSelectCategory={setSelected}
              query={query}
              selectedCategoryId={selected}
              categories={[
                { id: 'all', label: 'All' },
                { id: 'frontend', label: 'Frontend' },
                { id: 'backend', label: 'Backend' },
                { id: 'infra', label: 'Infra' },
              ]}
            />
          </section>

          <section className="components-lab-section components-lab-section-search-snapshots">
            <h2>Search Snapshots</h2>
            <div className="components-lab-state-grid">
              <article className="components-lab-state-card">
                <h3>SearchBar</h3>
                <div className="components-lab-list-stack">
                  <div className="components-lab-state-item">
                    <span>기본</span>
                    <SearchBar readOnly value="" />
                  </div>
                  <div className="components-lab-state-item">
                    <span>입력됨</span>
                    <SearchBar readOnly value="react" />
                  </div>
                </div>
              </article>

              <article className="components-lab-state-card">
                <h3>SearchFilter</h3>
                <div className="components-lab-list-stack">
                  <div className="components-lab-state-item">
                    <span>기본</span>
                    <SearchFilter
                      mode="Desktop"
                      onQueryChange={() => undefined}
                      query=""
                      selectedCategoryId="all"
                      categories={[
                        { id: 'all', label: 'All' },
                        { id: 'frontend', label: 'Frontend' },
                        { id: 'backend', label: 'Backend' },
                        { id: 'infra', label: 'Infra' },
                      ]}
                    />
                  </div>
                  <div className="components-lab-state-item">
                    <span>선택됨</span>
                    <SearchFilter
                      mode="Desktop"
                      onQueryChange={() => undefined}
                      query="infra"
                      selectedCategoryId="frontend"
                      categories={[
                        { id: 'all', label: 'All' },
                        { id: 'frontend', label: 'Frontend' },
                        { id: 'backend', label: 'Backend' },
                        { id: 'infra', label: 'Infra' },
                      ]}
                    />
                  </div>
                </div>
              </article>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ComponentsMiniGamePage;
