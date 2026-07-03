-- PromptVault 示例种子数据
-- 在执行完 schema.sql 后可选执行，用于快速体验界面效果

with cat as (
  insert into categories (type, name, sort_order) values
    ('image', '人像', 0),
    ('image', '场景', 1),
    ('video', '运镜', 0),
    ('video', '转场', 1)
  returning id, type, name
)
insert into prompts (id, title, body, type, category_id, tags, source_url, notes, is_favorite, created_at, updated_at)
select
  gen_random_uuid(),
  v.title, v.body, v.type,
  (select id from cat where cat.type = v.type and cat.name = v.category_name),
  v.tags, v.source_url, v.notes, v.is_favorite, now(), now()
from (
  values
    ('赛博朋克人像', '一位女性半身像，霓虹灯光打在脸上，赛博朋克风格，超写实，8k，电影感光影，雨夜街道背景，紫色与青色主色调', 'image', '人像',
      array['赛博朋克','人像','写实'], 'https://example.com/p1', '在 ChatGPT 里效果不错，光影层次很好', true),
    ('国风水墨人像', '中国水墨画风格的古风女子肖像，留白构图，淡墨渲染，飘逸发丝，宣纸质感，意境空灵', 'image', '人像',
      array['国风','水墨','肖像'], null, null, false),
    ('极简产品场景', '一瓶香水放置在纯色背景前，柔和阴影，极简主义摄影棚布光，产品广告级质感，居中构图', 'image', '场景',
      array['产品','极简','广告'], 'https://example.com/p3', null, false),
    ('未来城市场景', '俯瞰未来城市天际线，飞行汽车穿梭，巨型全息广告牌，日落时分，暖冷光对比强烈', 'image', '场景',
      array['科幻','城市','建筑'], null, '适合做壁纸', true),
    ('无人机航拍运镜', '无人机从低空缓慢上升，穿过树林间隙，最终俯瞰整片森林，运镜平滑，电影级航拍质感', 'video', '运镜',
      array['航拍','自然'], null, null, false),
    ('环绕人物运镜', '镜头围绕主角 360 度环绕旋转，背景轻微虚化，人物始终居中，动感强烈，适合角色展示', 'video', '运镜',
      array['环绕','人物展示'], 'https://example.com/p6', '在即梦测试过，效果稳定', true)
) as v(title, body, type, category_name, tags, source_url, notes, is_favorite)
returning id, title;

-- 为「赛博朋克人像」「环绕人物运镜」补充多版本历史，用于演示版本对比功能
do $$
declare
  p1 uuid;
  p2 uuid;
begin
  select id into p1 from prompts where title = '赛博朋克人像' limit 1;
  select id into p2 from prompts where title = '环绕人物运镜' limit 1;

  if p1 is not null then
    insert into prompt_versions (prompt_id, version_no, label, body, created_at) values
      (p1, 1, '原始版', '一位女性半身像，霓虹灯光，赛博朋克风格', now() - interval '3 day'),
      (p1, 2, '修改版', '一位女性半身像，霓虹灯光打在脸上，赛博朋克风格，超写实，8k', now() - interval '1 day'),
      (p1, 3, '最终版', '一位女性半身像，霓虹灯光打在脸上，赛博朋克风格，超写实，8k，电影感光影，雨夜街道背景，紫色与青色主色调', now())
    on conflict (prompt_id, version_no) do nothing;
  end if;

  if p2 is not null then
    insert into prompt_versions (prompt_id, version_no, label, body, created_at) values
      (p2, 1, '原始版', '镜头围绕主角旋转，人物居中', now() - interval '2 day'),
      (p2, 2, '最终版', '镜头围绕主角 360 度环绕旋转，背景轻微虚化，人物始终居中，动感强烈，适合角色展示', now())
    on conflict (prompt_id, version_no) do nothing;
  end if;
end $$;

-- 其余提示词补一条 version 1（原始版），保持「每条提示词至少有一个版本」的不变量
insert into prompt_versions (prompt_id, version_no, label, body, created_at)
select p.id, 1, '原始版', p.body, p.created_at
from prompts p
where not exists (
  select 1 from prompt_versions pv where pv.prompt_id = p.id
);
